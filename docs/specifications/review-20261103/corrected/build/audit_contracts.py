#!/usr/bin/env python3
"""Measure how completely each of the 181 service contracts covers the
mandatory 12-part template (Volume 1, 8.5: A Identity, B User objective,
C Existing implementation, D Evidence status, E Exact missing work,
F Backend contract, G Frontend contract, H Lifecycle, I Safety,
J Error and recovery, K Acceptance tests, L Delivery proof).

Two kinds of hit are recorded, because the volumes use different vocabularies:
  label   - the template word appears literally ("Frontend:")
  semantic- an equivalent construction appears ("Operation:", "Elevation:",
              a named command line, a stated parse rule)
A service can be substantive but off-template; that is exactly the condition the
owner correction pass asked to be identified, so both are reported.
"""
import csv
import json
import os
import re
import sys

PARTS = {
    "A": (r"^D\d\d\.\d\d — ", [r"Ref", r"catalog"]),
    "B": (r"Objective:", [r"Problem", r"lets the user", r"user can", r"why it exists"]),
    "C": [r"Existing implementation", r"Current implementation", r"NOT VERIFIED until"],
    "D": [r"Evidence status", r"DIRECTIVE", r"LEDGER"],
    "E": [r"Missing-work", r"Remaining", r"gap"],
    "F": [r"Backend:", r"Operation:", r"Provider:"],
    "G": [r"Frontend:", r"UI:", r"Workspace:"],
    "H": [r"Lifecycle:", r"Discover .*Execute", r"stages:"],
    "I": [r"Safety:", r"Elevation:", r"Consent", r"read-only"],
    "J": [r"Errors?:", r"Error taxonomy", r"failure", r"retry"],
    "K": [r"Acceptance[: ]", r"fixture", r"test"],
    "L": [r"Delivery proof", r"SHA", r"evidence record"],
}

DOMAIN_OF = {"D01": "01", "D02": "02", "D03": "03", "D04": "04", "D05": "05", "D06": "06",
             "D07": "07", "D08": "08", "D09": "09", "D10": "10", "D11": "11", "D12": "12",
             "D13": "13", "D14": "14"}


def blocks(text):
    """Map each spec ref to its contract block, taking the last heading match."""
    out = {}
    lines = text.split("\n")
    idxs = [(i, m.group(0)) for i, line in enumerate(lines)
            if (m := re.match(r"^(D\d\d\.\d\d) — ", line))]
    for n, (i, header) in enumerate(idxs):
        ref = header.split(" — ")[0]
        end = idxs[n + 1][0] if n + 1 < len(idxs) else len(lines)
        body = "\n".join(lines[i + 1:end])
        out[ref] = out.get(ref, "") + body + "\n"  # keep every occurrence
    return out


def main():
    repo = sys.argv[1] if len(sys.argv) > 1 else "."
    pkg = os.path.join(repo, "_spec_review/pkg/Spec")
    text = ""
    for name in ("Volume_1_Sections_01-22.md", "Volume_2_4-5_Sections_23-31.md"):
        text += open(os.path.join(pkg, name), encoding="utf-8",
                     errors="replace").read() + "\n"
    bl = blocks(text)
    rows = list(csv.DictReader(open(os.path.join(
        repo, "_spec_review/out/matrix_181_v2.csv"), encoding="utf-8")))
    result = {}
    for row in rows:
        ref = row["spec_ref"]
        body = bl.get(ref, "")
        hit = {"block_chars": len(body)}
        for part, spec in PARTS.items():
            label, semantic = (spec if isinstance(spec, tuple) else (None, spec))
            hit[part + "_label"] = bool(label and re.search(label, body, re.M))
            hit[part + "_semantic"] = bool(any(re.search(p, body, re.I) for p in semantic))
        result[ref] = hit
    covered = lambda ref, p: result[ref][p + "_label"] or result[ref][p + "_semantic"]
    summary = {
        "contracts_found": sum(1 for r in result.values() if r["block_chars"] > 0),
        "empty_blocks": sorted(k for k, v in result.items() if v["block_chars"] == 0),
        "per_part_missing": {
            p: sorted(ref for ref in result if not covered(ref, p))
            for p in PARTS},
        "parts_covered_per_service": {
            ref: sum(1 for p in PARTS if covered(ref, p)) for ref in sorted(result)},
        "size_quantiles_chars": {
            "smallest": sorted((v["block_chars"], k) for k, v in result.items())[:12],
            "largest": sorted((v["block_chars"], k) for k, v in result.items())[-6:]},
    }
    out = os.path.join(repo, "_spec_review/out/contract_audit.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump({"summary": summary, "detail": result}, fh, indent=2, ensure_ascii=False)
    from collections import Counter
    print(json.dumps({
        "contracts_found": summary["contracts_found"],
        "distribution": dict(sorted(Counter(summary["parts_covered_per_service"].values()).items())),
        "missing_counts": {p: len(v) for p, v in summary["per_part_missing"].items()},
        "empty_blocks": summary["empty_blocks"],
    }, indent=2))


if __name__ == "__main__":
    main()
