"""Negative provenance regressions; no user data, network, Git writes or app runtime."""
import copy
import importlib.util
import sys
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("evidence_gate", Path(__file__).with_name("verify-execution-evidence.py"))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class EvidenceGateTests(unittest.TestCase):
    def setUp(self):
        self.receipt = {"schemaVersion": 1, "root": "fixture", "remote": gate.REMOTE,
            "branch": "main", "head": "a" * 40, "workingTree": [" M source.ts"],
            "sourceSha256": {"source.ts": "first-content"}, "indexSha256": "first-index", "snapshotConsistent": True}

    def test_unchanged_receipt(self):
        self.assertEqual(gate.compare_receipt(self.receipt, copy.deepcopy(self.receipt)), [])

    def test_same_head_modified_dirty_content_is_stale(self):
        current = copy.deepcopy(self.receipt)
        current["sourceSha256"]["source.ts"] = "new-content"
        self.assertIn("STALE_sourceSha256", gate.compare_receipt(self.receipt, current))
        staged = copy.deepcopy(self.receipt)
        staged["indexSha256"] = "different-staged-blob-same-status"
        self.assertIn("STALE_indexSha256", gate.compare_receipt(self.receipt, staged))

    def test_new_head_and_new_untracked_path_are_stale(self):
        current = copy.deepcopy(self.receipt)
        current["head"] = "b" * 40
        current["workingTree"].append("?? new-proof.json")
        self.assertEqual(gate.compare_receipt(self.receipt, current), ["STALE_head", "STALE_workingTree"])

    def test_incomplete_receipt_and_racing_writer_refused(self):
        current = copy.deepcopy(self.receipt)
        current["snapshotConsistent"] = False
        self.assertIn("CURRENT_SNAPSHOT_INCONSISTENT", gate.compare_receipt({}, current))
        self.assertIn("UNSUPPORTED_RECEIPT_SCHEMA", gate.compare_receipt({}, current))
        self.assertEqual(gate.compare_receipt([], current), ["INVALID_RECEIPT_OBJECT"])
        self.assertEqual(gate.compare_receipt(None, current), ["INVALID_RECEIPT_OBJECT"])

    def test_green_ci_on_other_sha_is_not_evidence(self):
        runs = [{"headSha": "b" * 40, "name": "KNOuX Gemini Standalone",
                 "status": "completed", "conclusion": "success"}]
        self.assertEqual(gate.ci_gate(self.receipt["head"], runs), "UNVERIFIED_NO_MATCHING_RUN")
        self.assertEqual(gate.ci_gate(self.receipt["head"], [None]), "UNVERIFIED_INVALID_CI_RESPONSE")

    def test_latest_failed_or_running_ci_cannot_use_old_green(self):
        green = {"headSha": self.receipt["head"], "name": "KNOuX Gemini Standalone",
                 "status": "completed", "conclusion": "success"}
        failed = dict(green, conclusion="failure")
        self.assertEqual(gate.ci_gate(self.receipt["head"], [failed, green]), "FAILED")
        self.assertEqual(gate.ci_gate(self.receipt["head"], [dict(green, status="in_progress"), green]), "UNVERIFIED_IN_PROGRESS")
        self.assertEqual(gate.ci_gate(self.receipt["head"], [green]), "VERIFIED_SCOPED_CI")


if __name__ == "__main__":
    unittest.main(verbosity=2)
