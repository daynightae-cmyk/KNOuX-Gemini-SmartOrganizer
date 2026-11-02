"""KNOuX mission ledger gate — read-only, project-locked, JSON to stdout only.

The ledger is the acceptance record, so this gate treats an optimistic record as
a failure rather than a style problem. It checks that:

  * every record carries the full column set the owner mandated;
  * `status` only ever uses the declared vocabulary;
  * every referenced source path, test artefact and evidence file exists;
  * a `COMPLETE_VERIFIED` mission cannot exist without a commit SHA, a remote
    SHA, a CI result and at least one real runtime/visual artefact — the exact
    shortcut that turns a build into a false "done";
  * `BLOCKED_EXTERNAL` names what the owner has to supply, so a blocked gate can
    never be recorded as a vague future task.

Exit 0 = consistent, 1 = violations (listed), 2 = the ledger itself is unreadable.
Nothing here fetches, commits, pushes or touches application state.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHA = re.compile(r"^[0-9a-f]{40}$")

REQUIRED_COLUMNS = [
    "missionId", "title", "scope", "sourcePaths", "baselineSha", "dependencies",
    "ui", "nativeProvider", "apiIpc", "persistence", "securityConsent", "tests",
    "electronEvidence", "visualReference", "commitSha", "remoteSha", "ci",
    "status", "outstandingExternalRequirements",
]
ACCEPTANCE_STATUS = "COMPLETE_VERIFIED"
NOT_APPLICABLE = {"not-applicable", "n/a", ""}


def as_path(value: str) -> Path:
    return (ROOT / value).resolve()


def inside_repo(path: Path) -> bool:
    try:
        path.relative_to(ROOT.resolve())
    except ValueError:
        return False
    return True


def check_record(record: dict) -> list[str]:
    problems: list[str] = []
    label = record.get("missionId", "<missing id>")

    for column in REQUIRED_COLUMNS:
        if column not in record:
            problems.append(f"{label}: missing column '{column}'")

    vocabulary = record.get("_statusVocabulary", [])
    status = record.get("status")
    if vocabulary and status not in vocabulary:
        problems.append(f"{label}: status '{status}' is outside the declared vocabulary")

    for column in ("baselineSha", "commitSha", "remoteSha"):
        value = record.get(column)
        if value is None:
            continue
        if not isinstance(value, str) or not SHA.match(value):
            problems.append(f"{label}: {column} is not a full 40-character SHA")

    for path in record.get("sourcePaths", []):
        if not inside_repo(as_path(path)):
            problems.append(f"{label}: source path escapes the checkout: {path}")
        elif not as_path(path).exists():
            problems.append(f"{label}: declared source path is absent: {path}")

    for artefact in record.get("electronEvidence", []) or []:
        if not inside_repo(as_path(artefact)):
            problems.append(f"{label}: evidence path escapes the checkout: {artefact}")
        elif not as_path(artefact).exists():
            problems.append(f"{label}: cited evidence does not exist: {artefact}")

    if status == ACCEPTANCE_STATUS:
        runtime = record.get("runtimeScope")
        if runtime is None:
            problems.append(f"{label}: runtimeScope must be declared true or false")
        if runtime and not record.get("electronEvidence"):
            problems.append(f"{label}: accepted without any actual runtime/visual evidence")
        if runtime is False:
            # A non-runtime record must genuinely have no runtime layer, or the
            # flag becomes a way to skip the evidence requirement.
            for column in ("ui", "nativeProvider", "apiIpc"):
                if (record.get(column) or "").strip().lower() not in NOT_APPLICABLE:
                    problems.append(
                        f"{label}: runtimeScope false but {column} declares real work — cite runtime evidence")
        for column in ("commitSha", "remoteSha", "ci"):
            if not record.get(column):
                problems.append(f"{label}: accepted without {column}")
        if not record.get("tests"):
            problems.append(f"{label}: accepted without recorded tests")

    if status == "BLOCKED_EXTERNAL" and not record.get("outstandingExternalRequirements"):
        problems.append(f"{label}: BLOCKED_EXTERNAL must name exactly what the owner must supply")

    if status in ("PARTIAL", "UNVERIFIED") and record.get("commitSha") and not record.get("ci"):
        problems.append(f"{label}: pushed work must record its CI result even when partial")

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ledger", default=str(ROOT / "docs" / "MISSION_LEDGER.json"))
    parser.add_argument("--allow-missing-evidence", action="store_true",
                        help="report absent artefacts as warnings (for in-flight records)")
    args = parser.parse_args()

    try:
        ledger = json.loads(Path(args.ledger).read_text(encoding="utf-8-sig"))
    except Exception as error:  # noqa: BLE001 - the gate must say why it cannot read
        print(json.dumps({"ok": False, "error": f"unreadable ledger: {error}"}, indent=2))
        return 2

    vocabulary = sorted(ledger.get("statusVocabulary", {}))
    problems: list[str] = []
    warnings: list[str] = []
    seen: set[str] = set()

    for record in ledger.get("missions", []):
        record = dict(record)
        record["_statusVocabulary"] = vocabulary
        mid = record.get("missionId")
        if mid in seen:
            problems.append(f"duplicate missionId: {mid}")
        seen.add(mid)
        found = check_record(record)
        if args.allow_missing_evidence:
            for item in found:
                (warnings if "does not exist" in item or "absent" in item else problems).append(item)
        else:
            problems.extend(found)

        for dependency in record.get("dependencies", []):
            if dependency not in seen and dependency not in {m.get("missionId") for m in ledger.get("missions", [])}:
                problems.append(f"{mid}: depends on unknown mission {dependency}")

    summary = {
        "ledger": str(Path(args.ledger).relative_to(ROOT)) if inside_repo(Path(args.ledger)) else args.ledger,
        "missions": len(ledger.get("missions", [])),
        "statuses": {record.get("missionId"): record.get("status") for record in ledger.get("missions", [])},
        "ok": not problems,
        "problems": problems,
        "warnings": warnings,
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
