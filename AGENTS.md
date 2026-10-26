# REAL-SERVICE PRODUCT ACCEPTANCE — OVERRIDES READ-ONLY FINALITY

Read missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md. A read-only or dry-run milestone is NOT a final product-complete action service. Actual executor implementation and disposable-fixture side-effect tests are REQUIRED while any LIVE changes to the owner's files/OS/accounts require their explicit separate user approval. Keep all past validated work and preserve the current in-flight source changes. After 04/14/01 complete, run the documented per-service activation pass instead of declaring 100% finished. Track every service ID in docs/SERVICE_CAPABILITY_MATRIX.md.

---

# KNOuX Smart Gemini — mandatory workspace and Git rules

## Absolute canonical development environment
- Repository root: D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer
- ONLY remote: https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git
- ONLY development branch: feat/gemini-missions
- App code and native Electron: apps/gemini-ui/
- Reused Windows providers in this SAME repo: electron/
- ONLY active task library: missions/
- Active task entry point: missions/STANDALONE_AUTONOMOUS_ENTRY.md
- Next incomplete mission: 02_SMART_SCAN_FULLSTACK_MISSION.md

## Fail-closed verification before any code write, test or Git action
From the canonical repository root, run:
    python scripts/verify-workspace.py
If FAIL, stop. Never auto-checkout or initialize another repository to remedy a failure.
Before commit check the Git status, staged diff, concurrent writers, no secrets, tests, and actual remote.
Push only origin feat/gemini-missions (normal fast-forward). No force-push, reset --hard, clean or destructive rebase.

## RETIRED paths — do not write or execute in them
- D:\KNOUX-Workspace\KNOuX-Gemini-UI (historical mixed-repository checkout)
- D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025 (retired external mission copies; active MDs there redirect here)
- K: KNOuX legacy worktrees
- GitHub repository daynightae-cmyk/Knoux-SmartOrganizer (retired for Gemini)

These paths are historical and for audited provenance only. No Root old Electron entrypoint, visual smoke, CI, old application, Root installer or packaging is a Gemini acceptance gate.

## Already integrated and audited
All Qoder-authored Gemini tracked files in the pinned mixed-repo snapshot e3d612e are in THIS repository: 381/381 application source blobs, 9/9 required native module blobs. Additional ignored Gemini visual source/evidence was recovered: 816/816 files copied and SHA-256-verified. Older 23 smoke variants and 7 task generators preserved inside migration-history. Original 10 approved refs and 15 screenshot captures present. The old source's later commits through 98a9ec5 changed no tracked Gemini application or required native engine paths.
- 00V Visual UI
- 00P Secure native Electron
- 03 Organization Studio (read-only measured)
- 06 Files (read-only measured)
- 07 Storage (read-only measured)
Do NOT redo them or replace measured APIs with fixtures.

## Next safe execution
Read missions/STANDALONE_AUTONOMOUS_ENTRY.md and implement Mission 02 Smart Scan. Test actual Electron, native and viewports. Commit reviewed work, push to NEW GitHub repo, verify SHA and independent CI before continuing.
Do not manipulate personal files, install/uninstall applications, change services/startup/registry, elevate, connect accounts or execute live write operations without explicit approval.


## Mandatory interactive workbench & real controls — Mission 15A

Read missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md and enforce it across all 14 domains as the UX prerequisite of Real Service Mission 15. Every service opens a pinned side or expanded full workbench with real tool-specific controls, not inert panels. Never conflate acceptance of old read-only milestones with product functionality. Honor the sole canonical workspace and consent/safety boundaries.
