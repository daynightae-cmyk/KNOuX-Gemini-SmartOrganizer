#!/usr/bin/env python3
"""Generate the Contract Completion Layer: all 181 service contracts in the
full A-L structure mandated by Volume 1 section 8.5.

Input is the measured matrix (matrix_181_v2.csv), the typed native binding map
(native_binding_map.json) and the registered contract (native-contract.json).
Nothing in the emitted blocks is invented: each line is either
  VERIFIED  - this tool read it out of a file in the repository, or
  REQUIRED  - it is a requirement the specification imposes, or
  NOT RUN   - it states that no proof exists, or
  TASK      - it is a concrete instruction for Codex to resolve a unknown.

Cross-references replace restatement, so this layer cannot drift out of sync with
the volumes it points at.
"""
import csv
import json
import os
import re
from collections import OrderedDict, defaultdict

LIFECYCLE = {
    "A": ["Discover", "Configure", "Verify", "Record"],
    "B": ["Discover", "Configure", "Preview", "Authorize", "Execute", "Verify", "Record", "Recover"],
    "C": ["Discover", "Configure", "Preview", "Authorize", "Execute", "Verify", "Record"],
    "D": ["Configure", "Authorize", "Discover", "Verify", "Record"],
}

# Item 7 of the owner correction: completion cannot be one blanket condition.
COMPLETION = OrderedDict([
    ("READ_ONLY_BY_DESIGN",
     "Complete when every displayed field is provider-measured, every unmeasurable field is "
     "shown as unavailable with its reason code, and a fixture test proves the numbers equal "
     "ground truth. Packaged/owner-data layers do NOT apply and must not be demanded; the "
     "service is finished without them and must not be marked partial for lacking them."),
    ("REVERSIBLE_WITH_JOURNAL",
     "Complete when the mutation runs on a disposable fixture, the journal entry is written "
     "before the effect, the postcondition is re-read from the filesystem or the OS, and undo "
     "restores the prior state on the same fixture. Then, separately: real Electron session, "
     "packaged build, and owner-data consent run. Each of those three is its own gate; none "
     "may be inferred from the others."),
    ("IRREVERSIBLE_OR_VENDOR_SIDE",
     "Complete up to and including an honest preview, an explicit typed consent screen naming "
     "the exact command, the elevation prompt handled as its own state, and a truthful "
     "'this cannot be undone' statement. Full product completion additionally requires a real "
     "vendor outcome on a disposable machine; without it the service ships as capability-"
     "gated and says so in the UI. Do not write a rollback for an operation that has none."),
    ("MIXED_READ_AND_PRIVILEGED",
     "Split the service: the read path is completed to the read-only bar above; the privileged "
     "path is completed to the irreversible bar above. A row may not be marked complete on the "
     "strength of its read half alone."),
    ("IN_APP_ONLY",
     "Complete when the in-app construct (draft, schedule, dry-run) persists, validates, and "
     "states in the UI that no OS task or external effect was created. Proving an OS effect is "
     "out of scope unless the scope changes by owner decision."),
    ("PROVIDER_DEPENDENT",
     "Complete locally when the credential flow, scope recording, revocation, least-privilege "
     "call path and honest 'not connected' states are implemented and tested against a mock "
     "provider. Live completion requires a real authorized account and, for restricted scopes, "
     "vendor verification. Both must be recorded; a mock pass is never reported as live."),
    ("UNCLASSIFIED_NO_IN_CODE_SERVICE",
     "Cannot be completed as specified because the service has no identity in code. First "
     "action: decide with the owner whether the entry stays a service or becomes a tile that "
     "routes to another domain's service. Until then, no acceptance condition applies."),
    ("REVERSIBLE_LOCAL",
     "Complete when the effect is local, reversible, and its reversal is tested."),
    ("ACTION_WITHOUT_EXECUTOR_YET",
     "No executor of any kind exists for this action in source today, so no undo, packaged or "
     "owner-data gate can be demanded yet. Completion is staged and each stage is recorded "
     "separately: (1) preview and plan-hash approval, (2) a real executor behind a consent gate, "
     "then (3) journal + postcondition verify, then (4) undo or documented impossibility of undo, "
     "then (5) real Electron session, (6) packaged build, (7) owner-data run with consent. "
     "A service at stage 2 is reported as stage 2, never as 'partially complete'."),
    ("PRIVILEGED_WINDOWS",
     "Complete when elevation is detected per action, requested through the OS prompt rather "
     "than assumed, the user-declined path is a tested first-class state, and the effect is "
     "re-read from the OS afterwards. If the underlying operation has no rollback in the "
     "platform, the UI must say so and no undo gate may be written for it."),
])

ENVELOPE_FIELDS = (
    " fields: `contractVersion:number`, `capability:string`, `requestId:string`, `status:'available'|'unavailable'"
    "|'unsupported'|'permission_denied'|'partial'|'cancelled'|'failed'|'complete'`, `source:string`,"
    " `observedAt:string`, `permission:'read-only'|'user-initiated'|'not-granted'`, `warnings:string[]`,"
    " `data?:T`, `error?:{code:string; message:string; retryable:boolean}`, "
    "`provenance?:{provider,mode:'measured'|'fixture'|'unavailable',observedAt,coverage?,"
    "permissions?,warnings?}`")


def clip(text, n):
    """Truncate at a separator so no cited path is ever cut mid-token."""
    text = (text or "").strip()
    if len(text) <= n:
        return text
    head = text[:n]
    for sep in (";", " ", ","):
        i = head.rfind(sep)
        if i >= n * 0.55:
            return head[:i].rstrip(",; ") + " …"
    return head + " …"


def load(repo, out, name):
    with open(os.path.join(repo, out, name), encoding="utf-8") as fh:
        return fh.read()


def main():
    repo = r"D:/KNOUX-Workspace/KNOuX-Gemini-SmartOrganizer"
    outdir = os.path.join(repo, "_spec_review/out")
    dest = os.path.join(repo, "_spec_review/corrected/Contracts")
    os.makedirs(dest, exist_ok=True)
    rows = list(csv.DictReader(open(os.path.join(outdir, "matrix_181_v2.csv"),
                                    encoding="utf-8")))
    bindings = json.loads(load(repo, "_spec_review/out", "native_binding_map.json"))
    contract = json.loads(open(os.path.join(
        repo, "apps/gemini-ui/shared/native-contract.json"), encoding="utf-8").read())
    caps_by_family = defaultdict(list)
    for cap in contract["capabilities"].values():
        caps_by_family[cap["id"].split(".")[0]].append(cap)

    FAM = {"D01": None, "D02": "scan", "D03": "studio", "D04": "google", "D05": "apps",
           "D06": "files", "D07": "storage", "D08": "cleanup", "D09": "startup",
           "D10": "system", "D11": "repair", "D12": "services", "D13": "automation",
           "D14": None}
    MIS = json.loads(load(repo, "_spec_review/out", "contract_audit.json"))["summary"]
    missing = {p: set(v) for p, v in MIS["per_part_missing"].items()}
    parts_cov = MIS["parts_covered_per_service"]

    by_domain = defaultdict(list)
    for r in rows:
        by_domain[r["spec_ref"][:3]].append(r)

    index = []
    for dom in sorted(by_domain):
        fam = FAM[dom]
        caplist = caps_by_family.get(fam, []) if fam else []
        mission = dom[1:]
        bfile = (bindings.get(mission) or [{}])[0].get("file") or ""
        bfuncs = (bindings.get(mission) or [{}])[0].get("functions") or []
        lines = ["## Domain %s - %s\n" % (dom, by_domain[dom][0]["domain"][3:]),
                 "Family capability count registered: **%d**%s" % (
                     len(caplist),
                     "" if caplist else " (this domain has no native capability family at all)"),
                 "Typed renderer binding: `%s` (%d exported envelope-returning functions)%s\n" % (
                     bfile or "none found", len(bfuncs),
                     "" if bfuncs else " - this domain reaches the native layer another way "
                     "or not at all"),
                 ""]
        for r in by_domain[dom]:
            ref = r["spec_ref"]
            cls = r["class"]
            rev = r["reversibility_class"]
            chan = r["native_family_channels"]
            lines.append("### %s - `%s` - %s\n" % (ref, r["ledger_id"], r["service_name"]))
            lines.append("- **A. Identity** - spec ref %s; ledger id `%s` (class %s = %s); "
                         "domain %s; contract source %s; risk and evidence details in Volumes 6-7 "
                         "section 41 for this ref; reversibility class **%s**." % (
                             ref, r["ledger_id"], cls, r["operation_class"],
                             r["domain"], r["matrix_v1_contract_ref"] or "see Volumes 1-5",
                             rev))
            if ref in missing["B"]:
                lines.append("- **B. User objective** - NOT STATED in the source volume for this "
                             "entry. REQUIRED: add one sentence naming the problem and the visible "
                             "outcome before this service is scheduled for implementation.")
            else:
                lines.append("- **B. User objective** - see %s (not restated here; the contract "
                             "text in the volume is authoritative for intent)." %
                             (r["matrix_v1_contract_ref"] or "the domain section"))
            claim = ""
            if r["capmx_provider_claim"] and "AUDIT_REQUIRED" not in r["capmx_provider_claim"]:
                claim = (" LEDGER CLAIM (rank 5, confirm against source before use): provider "
                         "`%s`; executor/UI `%s`; consent/recovery `%s`; fixture gate `%s`." % (
                             clip(r["capmx_provider_claim"], 150),
                             clip(r["capmx_executor_claim"], 150),
                             clip(r["capmx_consent_claim"], 80),
                             clip(r["capmx_fixture_gate_claim"], 80)))
            lines.append("- **C. Existing implementation (VERIFIED in source now)** - "
                         "renderer key `%s`; integration point: %s; workbench component: %s%s; "
                         "native ops named at the located site: %s.%s" % (
                             r["ledger_id"], r["frontend_integration_point"],
                             r["workbench_component"] or "none resolved",
                             (" at " + r["component_definition"]) if r["component_definition"] else "",
                             r["native_ops_referenced"], claim))
            lines.append("- **D. Evidence status - two separate things** - "
                         "HISTORICAL (as recorded, not re-derived): %s / slice `%s`; "
                         "implementation SHA %s -> %s. "
                         "CURRENT RUNTIME VERIFICATION: %s. "
                         "REVALIDATION: **%s**." % (
                             clip(r["historical_status"], 150), r["historical_slice_status"],
                             (r["historical_implementation_sha"][:9]
                              if r["historical_implementation_sha"] else "none recorded"),
                             r["historical_sha_reachability"],
                             r["current_runtime_verification"], r["revalidation"]))
            lines.append("- **E. Exact missing work** - derived from verified facts only: %s" %
                         ("no catalog key or workbench for this id in renderer source; " if
                          r["frontend_integration_point"].startswith("NONE") else "") +
                         ("no native op is named at its integration site; " if
                          r["native_ops_referenced"] == "none found at the located site" else "") +
                         ("no gated test names this service; " if
                          r["gated_test_scripts_naming_this_id"] == "none" else "") +
                         ("this domain has no mutation executor in source, so the action half "
                          "does not exist yet; " if rev == "ACTION_WITHOUT_EXECUTOR_YET" else "") +
                         "everything else stays a TASK until the revalidation pass reads it.")
            lines.append("- **F. Backend contract (VERIFIED surface)** - %s%s "
                         "Envelope: NativeEnvelope%s. Any new operation must be registered in "
                         "`shared/native-contract.json` with a capability id and mode, not only "
                         "added to preload." % (
                             ("family channels: `%s` (count %s); " % (chan, len(caplist))
                              if caplist else "NO channel family is registered for this domain; "),
                             ("typed functions: %s; " % "; ".join(
                                 "%s():%s" % (f["fn"], f["payload"]) for f in bfuncs[:8])
                              if bfuncs else ""),
                             ENVELOPE_FIELDS))
            lines.append("- **G. Frontend contract (VERIFIED)** - integration point: %s. "
                         "All render sites for this id: %s." % (
                             r["frontend_integration_point"], r["id_sites_found_in_code"]))
            lines.append("- **H. Lifecycle** - %s" % (
                ("stated in the source contract; REQUIRED stages for a class %s service are %s "
                 "(cross-check the two)." % (cls, " -> ".join(
                     LIFECYCLE.get(cls, ["Discover", "Verify"])))
                 if ref not in missing["H"] else
                 "NOT STATED in the source volume. REQUIRED stages for a class %s service: %s. "
                 "(Derived from the class, not observed in source.)" % (
                     cls, " -> ".join(LIFECYCLE.get(cls, ["Discover", "Verify"]))))))
            lines.append("- **I. Safety** - reversibility class **%s**. Verified executor "
                         "evidence for this domain: %s. %s" % (
                             rev, clip(r["domain_executor_evidence"], 320),
                             {
                                 "READ_ONLY_BY_DESIGN":
                                     "No mutation path may be added to this service without a "
                                     "scope change; renderer must not gain write capability it "
                                     "does not display.",
                                 "REVERSIBLE_WITH_JOURNAL":
                                     "Effect requires plan-hash-bound approval, a journal record "
                                     "written before the effect, and a re-read postcondition. The "
                                     "renderer is untrusted; Main re-validates every argument.",
                                 "ACTION_WITHOUT_EXECUTOR_YET":
                                     "Nothing may be presented as actionable while the executor "
                                     "is absent: the control shows the gated state and does not "
                                     "invent a success path.",
                                 "IRREVERSIBLE_OR_VENDOR_SIDE":
                                     "Consent text must name the exact command and state truthfully "
                                     "that it cannot be undone. No rollback may be offered where the "
                                     "platform provides none.",
                                 "PROVIDER_DEPENDENT":
                                     "Least privilege: request only the scopes this service uses; "
                                     "revocation must delete the local grant; no live call without "
                                     "a verified authorization.",
                                 "PRIVILEGED_WINDOWS":
                                     "Elevation is requested per action and never inherited; the "
                                     "declined case is a supported state, not an error screen.",
                                 "UNCLASSIFIED_NO_IN_CODE_SERVICE":
                                     "No safety surface exists because no service surface exists; "
                                     "the owner decision in Part A comes first.",
                             }.get(rev, "Classify from source before implementing.")))
            lines.append("- **J. Error and recovery** - %susing only the verified "
                         "envelope fields: map provider absence to `status:'unavailable'` "
                         "with `error.code` and `error.retryable`; a user stop must land on "
                         "`status:'cancelled'`, never `failed`; partial traversal reports "
                         "`partial` with the failed items listed. Recovery: %s." % (
                             "" if ref not in missing["J"] else
                             "NOT STATED as a part in the source volume; REQUIRED, ",
                             "undo exists only where the journal and a preview exist - do not "
                             "claim it for this class" if rev in
                             ("IRREVERSIBLE_OR_VENDOR_SIDE", "READ_ONLY_BY_DESIGN",
                              "UNCLASSIFIED_NO_IN_CODE_SERVICE", "ACTION_WITHOUT_EXECUTOR_YET") else
                             "restore path is required and must be tested on the same fixture"))
            lines.append("- **K. Acceptance** - gated scripts naming this id today: %s; "
                         "ungated (exist, not wired): %s; universal suite U-1...U-7 plus the class "
                         "suite in Volumes 6-7 section 35 still apply." % (
                             r["gated_test_scripts_naming_this_id"],
                             r["ungated_test_scripts_naming_this_id"]))
            lines.append("- **L. Delivery proof** - NONE ON FILE for the current baseline. When "
                         "this service is touched, record: exact SHA, command, exit code, counts, "
                         "environment, and the fixture-vs-real label for each claim. A gate that "
                         "did not run is written as NOT RUN with its reason.")
            lines.append("- **Completion condition for this class** - %s" %
                         COMPLETION.get(rev, "uncertain: classify from source first (TASK)."))
            lines.append("- **Codex verification task** - %s\n" % r["codex_inspection_task"])
        name = "Contracts_%s.md" % dom
        with open(os.path.join(dest, name), "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines))
        index.append((name, len(by_domain[dom]),
                      sum(1 for r in by_domain[dom]
                          if not r["frontend_integration_point"].startswith("NONE"))))
    with open(os.path.join(dest, "00_INDEX.md"), "w", encoding="utf-8") as fh:
        fh.write("# Contract Completion Layer - index\n\n"
                 "One file per domain. Every one of the 181 entries is emitted in the full A-L "
                 "structure; parts that the source volumes left out are filled from measured "
                 "source, and parts that cannot be established are written as an explicit Codex "
                 "task instead of a guess.\n\n"
                 "| file | services | with a located renderer integration point |\n|---|---|---|\n")
        for name, n, ok in index:
            fh.write("| %s | %d | %d |\n" % (name, n, ok))
        fh.write("\n**Totals**: %d services, %d with a located integration point, %d where the "
                 "search proved no integration point exists (verified absence, not unknown).\n" % (
                     sum(n for _, n, _ in index), sum(ok for _, _, ok in index),
                     sum(n - ok for _, n, ok in index)))
    print("wrote", len(index), "domain files to", dest)


if __name__ == "__main__":
    main()
