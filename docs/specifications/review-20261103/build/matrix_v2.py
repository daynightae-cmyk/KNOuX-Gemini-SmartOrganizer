#!/usr/bin/env python3
"""
KNOuX 181-service matrix v2 generator.

WHY THIS EXISTS
  Matrix v1 (Volumes 6-7, Section 40) was assembled from a supplied evidence
  archive and could not open the repository, so every row's "native provider
  and operation ID" column degraded to `op-id: read native-contracts.ts`.
  This generator re-derives those columns from the repository itself, so the
  corrected matrix states what is actually in source today and marks the rest
  as an explicit Codex inspection task instead of a placeholder.

REPRODUCIBILITY
  Run from anywhere; paths are resolved from --repo (default: the canonical
  checkout). It is READ-ONLY: it never writes inside the repository, only into
  --out. Re-running after the repository moves is the intended use: the matrix
  is a generated artifact, so it cannot silently go stale the way a hand-typed
  table does.

HONESTY RULES ENCODED HERE
  1. A value is written as "verified" only when this script literally found it
     in a tracked file. Nothing is inferred from a ledger into a verified slot.
  2. Absence is reported as verified absence with the search that established
     it, not as "unknown".
  3. Historical ledger classifications are copied unchanged. This script never
     downgrades a previously verified service; it only separates it from
     current-runtime verification, which stays NOT RUN until a gate is re-executed.
"""
import argparse
import csv
import json
import os
import re
import subprocess
import sys
from collections import Counter, OrderedDict

DOMAIN_TITLES = {
    "01": "Home Command Center", "02": "Smart Scan", "03": "Organization Studio",
    "04": "Google Workspace", "05": "Applications", "06": "Files", "07": "Storage",
    "08": "Cleanup (Clean Room)", "09": "Startup (Boot Control)",
    "10": "System / Network / Hardware", "11": "Repair Lab (Recovery)",
    "12": "Services Commander", "13": "Automation (Flow Studio)",
    "14": "Settings / Engine / AI",
}

# Native family per ledger mission. Verified: shared/native-contract.json
# registers channels as knoux:<family>:v1:<method>.
FAMILY = {"01": None, "02": "scan", "03": "studio", "04": "google", "05": "apps",
          "06": "files", "07": "storage", "08": "cleanup", "09": "startup",
          "10": "system", "11": "repair", "12": "services", "13": "automation",
          "14": None}

# Where the per-service id list actually lives in code. Verified by reading each
# file at the time of authoring; the script re-locates by identifier, not by a
# hard-coded line, so it stays correct when the file moves.
CODE_CATALOG = {
    "02": ("apps/gemini-ui/electron/native/scan-bridge.cjs", "SERVICES"),
    "03": ("apps/gemini-ui/src/operations/organization-studio-model.ts", "STUDIO_STAGES"),
    "04": ("apps/gemini-ui/src/components/workspace/GoogleWorkspaceHub.tsx", "HUB_SERVICES"),
    "05": ("apps/gemini-ui/src/apps/catalog.ts", "SERVICE_ORDER"),
    "06": ("apps/gemini-ui/src/lib/file-inventory.ts", "FILES_DOMAIN_SERVICES"),
    "07": ("apps/gemini-ui/src/lib/storage-inventory.ts", "STORAGE_SERVICES_CATALOG"),
    "08": ("apps/gemini-ui/src/cleanup/model.ts", "SERVICE_IDS"),
    "09": ("apps/gemini-ui/src/startup/model.ts", "SERVICE_IDS"),
    "10": ("apps/gemini-ui/src/system/catalog.ts", "SERVICE_CATALOG"),
    "11": ("apps/gemini-ui/src/repair/catalog.ts", "REPAIR_TOOLS"),
    "12": ("apps/gemini-ui/src/services/catalog.ts", "SERVICES_TOOLS"),
    "13": ("apps/gemini-ui/src/automation/catalog.ts", "AUTOMATION_TOOLS"),
    "14": ("apps/gemini-ui/src/pages/SettingsPage.tsx", None),
    "01": (None, None),
}

# Reversibility / power classes. Item 7 of the owner correction directive:
# a single blanket completion condition is impossible across these classes.
# Every assignment below cites the verified native fact that justifies it.
EXECUTOR_EVIDENCE = {
    # verified true mutation executors present in source today
    "03": ("REVERSIBLE_WITH_JOURNAL",
           "OperationEngine execute/undo wired to knoux:operations:v1:execute|undo "
           "(electron/native/operation-ipc.cjs); real fsp.rename/mkdir in "
           "electron/studio/studio-organization.cjs"),
    "07": ("REVERSIBLE_WITH_JOURNAL",
           "StorageVault vaultExecute/vaultRestore (electron/native/storage-vault.cjs) "
           "perform same-volume quarantine moves; vault report fixes "
           "verifiedReclaimedBytes:0 (no purge)"),
    "08": ("REVERSIBLE_WITH_JOURNAL",
           "CleanupBridge itself executes nothing (cleanup-bridge.cjs: plan is "
           "review-only, header states no delete/move/recycle-empty/DISM); "
           "quarantine path runs through StorageVault, so restore exists but "
           "purge does not"),
    "09": ("REVERSIBLE_WITH_JOURNAL",
           "StartupActions apply writes only the HKCU ...\\CurrentVersion\\Run value "
           "(electron/native/startup-registry.cjs) with a receipt saved before "
           "mutation and a postcondition verify"),
    "12": ("REVERSIBLE_WITH_JOURNAL",
           "ServiceActions apply performs SCM start/stop only "
           "(electron/native/service-control.cjs); restart and startup-type "
           "change are gated; eligible() refuses protected/driver/unsigned targets"),
    "05": ("IRREVERSIBLE_OR_VENDOR_SIDE",
           "No install/update/uninstall executor exists; app-bridge.cjs header "
           "states there is deliberately no uninstall/install/update/association-write/"
           "registry-write channel and GATED_OPERATIONS defers them"),
    "11": ("IRREVERSIBLE_OR_VENDOR_SIDE",
           "repair-providers.cjs COMMAND_SPECS name DISM/SFC/netsh but GATED_OPERATIONS "
           "ships no executor; repair-bridge.cjs plan is execution.available:false"),
    "10": ("MIXED_READ_AND_PRIVILEGED",
           "SystemBridge is read-only end to end (ping/tracert/CIM reads; hosts is "
           "read + staged plan only); the ledger still classes network reset as class C"),
    "13": ("IN_APP_ONLY",
           "AutomationRunner executes only read-only Smart Scan nodes "
           "(AUTOMATION_ACTION_GATED, externalMutation:'none'); AutomationScheduler "
           "uses in-app timers and registers no OS task"),
    "04": ("PROVIDER_DEPENDENT",
           "GoogleOAuthService covers connect/disconnect/sheets list+read only; "
           "writes to any Google product are not implemented"),
    "14": ("PROVIDER_DEPENDENT",
           "No native settings/AI capability is registered; SettingsPage holds keys in "
           "renderer session storage and calls providers directly from the renderer"),
    "06": ("READ_ONLY_BY_DESIGN",
           "FilesBridge exposes only read/query/hash/metadata plus shell open/reveal; "
           "no write, move or delete path exists"),
    "02": ("READ_ONLY_BY_DESIGN",
           "ScanBridge composes read-only stages; no executor (scan-bridge.cjs)"),
    "01": ("UNCLASSIFIED_NO_IN_CODE_SERVICE",
           "No Home service catalog and no per-service workspace exists in source; "
           "the 12 Home entries are ledger-only identities"),
}

OPERATION_CLASS = {"A": "observe", "B": "act", "C": "privileged-or-irreversible",
                   "D": "external-provider"}

# Which domains actually contain a working mutation executor today (verified in
# section 2 of this file's EXECUTOR_EVIDENCE notes). A class B service in a domain
# with no executor cannot be completed with an undo gate - that is a different
# completion condition, so the classes below are computed per service rather than
# inherited from the domain.
HAS_EXECUTOR = {"03", "07", "08", "09", "12"}
PRIVILEGED_DOMAINS = {"11", "10"}


def reversibility_class(mission, ledger_class):
    """Per-service power/reversibility class (owner correction item 7)."""
    if mission == "01":
        return "UNCLASSIFIED_NO_IN_CODE_SERVICE"
    if ledger_class == "A":
        return "READ_ONLY_BY_DESIGN"
    if ledger_class == "D":
        return "PROVIDER_DEPENDENT"
    if ledger_class == "C":
        if mission in HAS_EXECUTOR:
            return "REVERSIBLE_WITH_JOURNAL"
        if mission in PRIVILEGED_DOMAINS:
            return "PRIVILEGED_WINDOWS"
        return "IRREVERSIBLE_OR_VENDOR_SIDE"
    # class B: an action. Does an executor exist for this domain today?
    if mission in HAS_EXECUTOR:
        return "REVERSIBLE_WITH_JOURNAL"
    return "ACTION_WITHOUT_EXECUTOR_YET"


def read(path):
    with open(path, encoding="utf-8", errors="replace") as handle:
        return handle.read()


def git(repo, *args):
    return subprocess.run(["git", "-C", repo, *args], capture_output=True,
                          text=True, errors="replace").stdout.strip()


def locate_ids(repo, mission):
    """Return (relpath, [ids in declaration order], note) for the in-code catalog."""
    relpath, identifier = CODE_CATALOG[mission]
    if not relpath:
        return (None, [], "no service catalog of any kind exists for this domain in source "
                          "(search: grep -rn \"mission-01-\" apps/gemini-ui/src)")
    text = read(os.path.join(repo, relpath))
    ids = []
    if mission == "14":
        ids = re.findall(r"\{\s*id:\s*'([a-z_]+)'", text)
    elif mission == "02":
        ids = re.findall(r"id:\s*'([a-z_]+)'", text)
    elif mission == "03":
        ids = re.findall(r"\['([^']+)'", text.split("STUDIO_STAGES")[1][:1200])
    elif mission in ("04",):
        ids = re.findall(r"id:\s*'([a-z_]+)'", text)
    elif mission == "07":
        ids = re.findall(r"serviceKey:\s*'([^']+)'", text) or re.findall(r"id:\s*'([^']+)'", text)
    else:
        block = text
        if identifier:
            i = text.find(identifier)
            if i >= 0:
                block = text[i:i + 6000]
        ids = re.findall(r"'([a-z0-9][a-z0-9-]{3,})'", block)
    # de-duplicate, keep order, drop obvious non-ids
    seen, ordered = set(), []
    for v in ids:
        if v not in seen and not v.startswith("http"):
            seen.add(v)
            ordered.append(v)
    return (relpath, ordered, "")


def find_case(repo, service_id):
    """Find every place the literal service id keys something in renderer code.

    A hit is only an integration point if it selects a *workbench*: a component
    registered in a map, or a case branch that returns JSX. Icon switches and
    navigation rails also contain the literal and must not be mistaken for a
    workspace, so each hit is classified and the strongest one is reported.
    """
    sites = []
    pat_case = re.compile(r"case\s+'%s'\s*:" % re.escape(service_id))
    pat_map = re.compile(r"'%s'\s*:\s*([A-Z][A-Za-z0-9]*)" % re.escape(service_id))
    pat_eq = re.compile(r"(service|serviceKey|tool|selected|id)\s*===\s*'%s'" % re.escape(service_id))
    for root, dirs, files in os.walk(os.path.join(repo, "apps/gemini-ui/src")):
        dirs[:] = [d for d in dirs if d not in ("node_modules", "dist", ".vite")]
        for name in files:
            if not name.endswith((".tsx", ".ts")):
                continue
            path = os.path.join(root, name)
            text = read(path)
            lines = text.split("\n")
            rel = os.path.relpath(path, repo).replace("\\", "/")
            for i, line in enumerate(lines):
                if pat_map.search(line):
                    comp = pat_map.search(line).group(1)
                    sites.append({"rel": rel, "line": i + 1, "kind": "WORKBENCH_MAP",
                                  "component": comp, "text": line.strip()})
                elif pat_case.search(line):
                    body_len, ops, comp, jsx, is_icon = classify_case(lines, i)
                    kind = "ICON_SWITCH" if is_icon else ("CASE_JSX" if jsx else "CASE_PLAIN")
                    if body_len >= 15 and not is_icon:
                        kind = "CASE_WORKBENCH"
                    sites.append({"rel": rel, "line": i + 1, "kind": kind,
                                  "component": comp, "body_lines": body_len,
                                  "ops": ops, "text": line.strip()})
                elif pat_eq.search(line):
                    sites.append({"rel": rel, "line": i + 1, "kind": "TERNARY_BRANCH",
                                  "component": "", "text": line.strip()})
    return sites


ICON_ONLY = re.compile(r"return\s+<[A-Z][A-Za-z0-9]*\s+className=")


def classify_case(lines, idx):
    """Extent, native ops, component returned, and whether it is icon-only."""
    indent = len(lines[idx]) - len(lines[idx].lstrip())
    label_re = re.compile(r"^case\s+'([^']+)'\s*:")
    end = idx
    for j in range(idx + 1, min(idx + 500, len(lines))):
        stripped = lines[j].strip()
        cur = len(lines[j]) - len(lines[j].lstrip())
        if (label_re.match(stripped) or stripped.startswith("default:") or
                stripped.startswith("};")) and cur <= indent:
            end = j - 1
            break
        end = j
    body = "\n".join(lines[idx:end + 1])
    ops = sorted({a or b for a, b in re.findall(
        r"knoux[A-Za-z]*V1\??\.([A-Za-z_][A-Za-z0-9_]*)\(?|contract\.channels\.([A-Za-z]+)", body)})
    comp_m = re.search(r"return\s*\(?\s*<?\s*<([A-Z][A-Za-z0-9]*)", body)
    comp = comp_m.group(1) if comp_m else ""
    is_icon = bool(ICON_ONLY.search(body)) and (end - idx) < 4
    return end - idx + 1, ops, comp, "<" in body and not is_icon, is_icon


def locate_component(repo, relpath, component):
    """Find where a workbench component is actually defined (file:line)."""
    if not component:
        return ""
    needle = re.compile(r"(export\s+)?(default\s+)?(function|const)\s+%s\b" % re.escape(component))
    src_root = os.path.join(os.path.dirname(os.path.join(repo, relpath)))
    for root, dirs, files in os.walk(src_root):
        dirs[:] = [d for d in dirs if d not in ("node_modules", "dist", ".vite")]
        for name in files:
            if not name.endswith((".tsx", ".ts")):
                continue
            path = os.path.join(root, name)
            for i, line in enumerate(read(path).split("\n")):
                if needle.search(line):
                    return "%s:%d" % (os.path.relpath(path, repo).replace("\\", "/"), i + 1)
    return ""


def component_ops(repo, component_file):
    """Native identifiers inside a workbench component definition."""
    if not component_file or ":" not in component_file:
        return []
    rel, ln = component_file.rsplit(":", 1)
    lines = read(os.path.join(repo, rel)).split("\n")
    start = int(ln) - 1
    end = start
    for j in range(start + 1, min(start + 900, len(lines))):
        if re.match(r"^(export\s+)?(async\s+)?(function|const|class)\s+[A-Za-z]", lines[j]):
            end = j - 1
            break
        end = j
    body = "\n".join(lines[start:end + 1])
    return sorted({a or b for a, b in re.findall(
        r"knoux[A-Za-z]*V1\??\.([A-Za-z_][A-Za-z0-9_]*)\(?|contract\.channels\.([A-Za-z]+)", body)})


def domain_binding(repo, mission):
    """Verified per-domain IPC binding: exported function -> shell method -> payload type.

    This is the layer matrix v1 could not state. Each renderer binding file calls
    exactly one typed shell API method and declares the envelope payload type, so
    the backend result contract is readable straight out of source.
    """
    paths = {
        "02": "apps/gemini-ui/src/scan/native.ts",
        "03": "apps/gemini-ui/src/studio/native.ts",
        "04": "apps/gemini-ui/src/workspace/google-native.ts",
        "05": "apps/gemini-ui/src/apps/native.ts",
        "06": "apps/gemini-ui/src/files/native.ts",
        "07": "apps/gemini-ui/src/storage/native.ts",
        "08": "apps/gemini-ui/src/cleanup/native.ts",
        "09": "apps/gemini-ui/src/startup/native.ts",
        "10": "apps/gemini-ui/src/system/native.ts",
        "11": "apps/gemini-ui/src/repair/native.ts",
        "12": "apps/gemini-ui/src/services/native.ts",
        "13": "apps/gemini-ui/src/automation/native.ts",
        "14": "apps/gemini-ui/src/clipboard/native.ts",
    }
    rel = paths.get(mission)
    if not rel:
        return (None, [])
    path = os.path.join(repo, rel)
    if not os.path.exists(path):
        return (rel + " (absent)", [])
    text = read(path)
    funcs = []
    for m in re.finditer(
            r"export async function (\w+)\s*\((.*?)\)\s*:\s*"
            r"Promise<NativeEnvelope<([^>]+)>\s*(?:\|\s*null)?>", text, re.S):
        chunk = text[m.end():m.end() + 700]
        shell = re.search(
            r"(?:shell|candidate|api|bridge)\??\.(?:has\(\)\s*\?\s*)?([A-Za-z0-9_]+)\(", chunk)
        funcs.append({"fn": m.group(1), "args": re.sub(r"\s+", " ", m.group(2)).strip()[:90],
                      "payload": m.group(3), "shell_method": shell.group(1) if shell else ""})
    return (rel, funcs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=r"D:/KNOUX-Workspace/KNOuX-Gemini-SmartOrganizer")
    ap.add_argument("--out", default="_spec_review/out")
    ap.add_argument("--v3", default="_spec_review/pkg/Spec/Volume_3_6-7_Sections_32-43.md")
    args = ap.parse_args()
    repo = os.path.abspath(args.repo)
    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)

    ledger = list(csv.DictReader(read(os.path.join(
        repo, "docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv")).splitlines()))
    assert len(ledger) == 181, len(ledger)

    # --- section 40 matrix (historical classification, copied unchanged) ---
    v3 = read(os.path.join(repo, args.v3)).split("\n")
    s40 = {}
    for line in v3:
        m = re.match(r"^\| (D[0-9]{2}) \| (D[0-9]{2}\.[0-9]{2}) \|(.*)\|\s*$", line)
        if m:
            cells = [c.strip() for c in m.group(3).split(" | ")]
            s40[m.group(2)] = cells

    contract = json.loads(read(os.path.join(
        repo, "apps/gemini-ui/shared/native-contract.json")))

    # --- capability matrix claims (rank 5: a dated claim, not evidence) ---
    # SERVICE_CAPABILITY_MATRIX.md carries one row per service with a real-provider,
    # executor, consent/recovery and fixture column. 122 of 181 rows are
    # AUDIT_REQUIRED placeholders; the other 59 are substantive and are ingested
    # here labelled as claims so they can be confirmed against source, never
    # promoted straight into a status.
    capmx = {}
    cpath = os.path.join(repo, "docs/SERVICE_CAPABILITY_MATRIX.md")
    if os.path.exists(cpath):
        lines = [l for l in read(cpath).split("\n")
                 if l.strip().startswith("|") and not re.match(r"^\|\s*[-: ]+\|", l)]
        for row in lines[1:]:
            c = [x.strip() for x in row.strip().strip("|").split("|")]
            if len(c) >= 10:
                capmx[c[1]] = {"provider": c[5], "executor": c[6],
                               "consent": c[7], "fixture": c[8], "state": c[9]}
    caps = contract["capabilities"]
    fam_caps = {}
    for cap in caps.values():
        fam = cap["id"].split(".")[0]
        fam_caps.setdefault(fam, []).append(cap)

    # --- which test artifacts name each service id, and whether they are gated ---
    pkg = json.loads(read(os.path.join(repo, "apps/gemini-ui/package.json")))
    gated_files = set()
    for name, command in pkg.get("scripts", {}).items():
        if name.startswith("test:") or name in ("lint", "build", "ledger:check"):
            for token in re.findall(r"scripts/([A-Za-z0-9_.-]+\.(?:cjs|mjs|py|ts))", command):
                gated_files.add(token)
    ids = {r["service_id"] for r in ledger}
    gated, ungated = {}, {}
    for script_dir in ("apps/gemini-ui/scripts", "apps/gemini-ui/tests"):
        base = os.path.join(repo, script_dir)
        if not os.path.isdir(base):
            continue
        for root, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d not in ("node_modules",)]
            for name in files:
                if not name.endswith((".cjs", ".mjs", ".ts", ".tsx", ".py")):
                    continue
                text = read(os.path.join(root, name))
                named = {i for i in ids if ("'%s'" % i) in text or ('"%s"' % i) in text}
                for sid in named:
                    bucket = gated if name in gated_files else ungated
                    bucket.setdefault(sid, [])
                    label = "%s/%s" % (script_dir, name)
                    if label not in bucket[sid]:
                        bucket[sid].append(label)

    # --- git facts (measured now, never asserted as a permanent baseline) ---
    head = git(repo, "rev-parse", "HEAD")
    branch = git(repo, "rev-parse", "--abbrev-ref", "HEAD")
    origin_main = git(repo, "rev-parse", "origin/main")
    ahead_behind = git(repo, "rev-list", "--left-right", "--count", "origin/main...HEAD")
    recorded_shas = sorted({r["implementation_sha"] for r in ledger if r["implementation_sha"]})
    reach = {}
    for sha in recorded_shas:
        try:
            exists = subprocess.run(["git", "-C", repo, "cat-file", "-e", sha],
                                    capture_output=True).returncode == 0
            ancestor = exists and subprocess.run(
                ["git", "-C", repo, "merge-base", "--is-ancestor", sha, "HEAD"],
                capture_output=True).returncode == 0
            reach[sha] = "REACHABLE from current HEAD" if ancestor else (
                "PRESENT but NOT reachable" if exists else "ABSENT from the object database")
        except Exception as exc:  # pragma: no cover
            reach[sha] = "UN MEASURED (%s)" % exc

    # --- per-service assembly ---
    counters = Counter()
    rows = []
    ordinal = Counter()
    binding_cache = {}
    binding_dump = {}
    KIND_RANK = {"CASE_WORKBENCH": 5, "WORKBENCH_MAP": 5, "CASE_JSX": 4,
                 "TERNARY_BRANCH": 3, "CASE_PLAIN": 2, "ICON_SWITCH": 1}
    for entry in ledger:
        mission = entry["mission"]
        ordinal[mission] += 1
        ref = "D%s.%02d" % (mission, ordinal[mission])
        fam = FAMILY[mission]
        caps_in_family = fam_caps.get(fam, []) if fam else []
        if mission not in binding_cache:
            rel_bind, funcs = domain_binding(repo, mission)
            binding_cache[mission] = (rel_bind, funcs)
            binding_dump[mission] = [{"file": rel_bind, "functions": funcs}]
        bind_file, bind_funcs = binding_cache[mission]
        sites = sorted(find_case(repo, entry["service_id"]),
                       key=lambda s: -KIND_RANK.get(s["kind"], 0))
        primary = sites[0] if sites else None
        if primary:
            integration = "%s:%d [%s]" % (primary["rel"], primary["line"], primary["kind"])
            body_len = primary.get("body_lines", "")
            body_ops = primary.get("ops", [])
            component = primary.get("component", "")
            comp_file = locate_component(repo, primary["rel"], component) \
                if primary["kind"] == "WORKBENCH_MAP" else ""
            if comp_file:
                body_ops = sorted(set(body_ops) | set(component_ops(repo, comp_file)))
        else:
            integration = ""
            body_len, body_ops, component, comp_file = "", [], "", ""
        assessed = entry["current_slice_status"] != "NOT_REASSESSED_IN_THIS_SLICE"
        counters["assessed" if assessed else "not_assessed"] += 1
        counters["located" if sites else "not_located"] += 1
        counters["kind_" + (primary["kind"] if primary else "NONE")] += 1
        rows.append(OrderedDict([
            ("spec_ref", ref),
            ("domain", "D%s %s" % (mission, DOMAIN_TITLES[mission])),
            ("ledger_id", entry["service_id"]),
            ("service_name", entry["name"]),
            ("class", entry["class"]),
            ("operation_class", OPERATION_CLASS.get(entry["class"], "unclassified")),
            ("reversibility_class", reversibility_class(mission, entry["class"])),
            ("domain_executor_evidence", EXECUTOR_EVIDENCE.get(mission, ("", "no evidence"))[1]),
            ("historical_status", entry["baseline_status"]),
            ("historical_slice_status", entry["current_slice_status"]),
            ("historical_implementation_sha", entry["implementation_sha"]),
            ("historical_sha_reachability", reach.get(entry["implementation_sha"], "") if
             entry["implementation_sha"] else "no SHA recorded in the ledger"),
            ("historical_evidence_path", entry["evidence"]),
            ("remaining_gate_as_recorded", entry["remaining_gate"]),
            ("current_runtime_verification", "NOT RUN at %s (this pass is a documentation "
                                             "correction; no per-service runtime gate was executed)" % head[:9]),
            ("revalidation", "MANDATORY SOURCE REVALIDATION" if not assessed else
                            "CONFIRM NOT REGRESSED (do not downgrade without evidence)"),
            ("in_code_catalog_id", entry["service_id"] if sites else
             ("NOT FOUND as a renderer key (this domain keys its UI off a different literal, "
              "or has no in-code catalog at all)" if mission in ("01", "02", "03", "04", "14")
              else "NOT FOUND in source")),
            ("frontend_integration_point", integration or
             "NONE VERIFIED - no case branch, workbench-map key or equality branch for this "
             "id exists anywhere under apps/gemini-ui/src"),
            ("workbench_component", component or ""),
            ("component_definition", comp_file or ""),
            ("case_body_lines", body_len or ""),
            ("id_sites_found_in_code", "; ".join("%s:%d %s" % (s["rel"], s["line"], s["kind"])
                                                 for s in sites[:4]) or "none"),
            ("native_ops_referenced", "; ".join(body_ops) or
             "none found at the located site"),
            ("gated_test_scripts_naming_this_id", "; ".join(gated.get(entry["service_id"], [])) or
             "none"),
            ("ungated_test_scripts_naming_this_id", "; ".join(ungated.get(entry["service_id"], [])) or
             "none"),
            ("native_family_capability_count", len(caps_in_family)),
            ("native_family_channels", "; ".join(sorted({c["channel"].rsplit(":v1:", 1)[-1]
                                                         for c in caps_in_family})) or
             "no capability family is registered for this domain"),
            ("renderer_binding_file", bind_file or
             "no renderer binding file exists for this domain (verified absence)"),
            ("renderer_binding_function_count", len(bind_funcs)),
            ("binding_functions_with_payload_types", "; ".join(
                "%s->%s" % (f["fn"], f["payload"]) for f in bind_funcs[:6]) or "none"),
            ("matrix_v1_row_found", "yes" if s40.get(ref) else "no"),
            ("matrix_v1_contract_ref", (s40.get(ref) or [""] * 10)[9] if s40.get(ref) else ""),
            ("capmx_provider_claim", capmx.get(entry["service_id"], {}).get("provider", "")),
            ("capmx_executor_claim", capmx.get(entry["service_id"], {}).get("executor", "")),
            ("capmx_consent_claim", capmx.get(entry["service_id"], {}).get("consent", "")),
            ("capmx_fixture_gate_claim", capmx.get(entry["service_id"], {}).get("fixture", "")),
            ("capmx_state_claim", capmx.get(entry["service_id"], {}).get("state", "")),
            ("codex_inspection_task", ""),
        ]))

    # --- inspection instructions: what Codex must read to close each unknown ---
    for row in rows:
        tasks = []
        if row["frontend_integration_point"].startswith("NONE"):
            tasks.append(
                "Open %s and confirm whether any component renders this service at all; "
                "if none does, record it as Exists-but-not-integrated with the route that "
                "should mount it." % (CODE_CATALOG[row["spec_ref"][1:3]][0] or
                                      "apps/gemini-ui/src/pages"))
        if row["native_ops_referenced"] == "none found at the located site":
            tasks.append(
                "Name the exact native function this service calls: read the located "
                "component/hook and trace it to electron/native/*-bridge.cjs and the "
                "knoux:*:v1:* channel; if the trace dead-ends, the service has no native "
                "binding and that is the gap to fix.")
        if not row["gated_test_scripts_naming_this_id"]:
            tasks.append(
                "No gated test names this service id. Add a per-service assertion to the "
                "domain suite already wired into npm (see ungated column for an existing "
                "but unwired suite that could be promoted instead of writing a new one).")
        if row["revalidation"].startswith("MANDATORY"):
            tasks.append(
                "Historical classification is unverified here: re-answer the 15 questions "
                "(Volume 1 8.3) against this HEAD before changing anything.")
        row["codex_inspection_task"] = " | ".join(tasks) or "none - row already specific"

    with open(os.path.join(out, "native_binding_map.json"), "w", encoding="utf-8") as fh:
        json.dump(binding_dump, fh, indent=2, ensure_ascii=False)

    with open(os.path.join(out, "matrix_181_v2.csv"), "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    summary = OrderedDict([
        ("measured_head", head), ("branch", branch), ("origin_main", origin_main),
        ("ahead_behind_origin_main", ahead_behind),
        ("rows", len(rows)),
        ("revalidation_mandatory", counters["not_assessed"]),
        ("confirm_not_regressed", counters["assessed"]),
        ("rows_with_renderer_integration_point", sum(1 for r in rows if not
                                                    r["frontend_integration_point"].startswith("NONE"))),
        ("rows_without_renderer_integration_point", sum(1 for r in rows if
                                                        r["frontend_integration_point"].startswith("NONE"))),
        ("integration_site_kinds", {k[5:]: v for k, v in counters.items() if k.startswith("kind_")}),
        ("rows_named_by_a_gated_test", sum(1 for r in rows if
                                           r["gated_test_scripts_naming_this_id"] != "none")),
        ("rows_named_only_by_ungated_tests", sum(1 for r in rows if
                                                 r["gated_test_scripts_naming_this_id"] == "none" and
                                                 r["ungated_test_scripts_naming_this_id"] != "none")),
        ("rows_no_test_names_at_all", sum(1 for r in rows if
                                          r["gated_test_scripts_naming_this_id"] == "none" and
                                          r["ungated_test_scripts_naming_this_id"] == "none")),
        ("gated_test_files_detected", sorted(gated_files)),
        ("registered_channels", len(contract["channels"])),
        ("registered_capabilities", len(caps)),
        ("capability_matrix_rows_ingested", len(capmx)),
        ("capability_matrix_rows_substantive", sum(
            1 for v in capmx.values()
            if "AUDIT_REQUIRED" not in v["provider"] and "NOT_VERIFIED" not in v["provider"])),
        ("modeled_service_identities", 181),
        ("recorded_sha_reachability", reach),
        ("matrix_v1_rows_matched", sum(1 for r in rows if r["matrix_v1_row_found"] == "yes")),
    ])
    with open(os.path.join(out, "matrix_181_v2_summary.json"), "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
