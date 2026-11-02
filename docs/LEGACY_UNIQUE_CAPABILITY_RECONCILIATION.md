# Legacy capability reconciliation — 2026-11-02

**PARTIAL**: source-backed inventory plus one recovery slice, not closure of the Ultimate Native Activation mission.

## Baselines and preservation

Gemini: canonical `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`, `main`, starting SHA `5d27ec1410b94db2d3ce78ce22ac964e91b3891e`; clean initial tracked/untracked status, no stashes, one worktree. Workspace guard passed. Fetched origin/main matched (0/0 divergence). Local `codex/service-workspaces-20261101` has no commits missing from main. No branch/worktree/history/assets were deleted, reset or overwritten.

Legacy is a **read-only donor** pinned at `2a94288a1f87d2842807060160a423e1ca55b67c`. Reviewed `electron/{clipboard-vault,advanced-local-services,tool-registry,safe-move,startup-manager,privileged-runner,automation,main,preload}.cjs`, `docs/{TOOL_MATRIX,PRODUCTION_STATUS}.md`. Its application was not run and its history was not merged. Its release assertions are not Gemini evidence.

Branch heads inspected: utility `85adea39a9ec432872d07f57c14b604a876e9ec4`; Studio workspace `12895297b92ce816a562b6034d06ef370f1caf32`; production distribution `ff8a4960f147ae30c1366d5cb39666511f423644`. Only utility advanced algorithms were compared in detail; the other branch-head lookups do not complete their unique-work audit.

## Initial nine differences

Donor paths refer to the pinned legacy SHA. Classifications describe the starting Gemini baseline; delivery is separate.

| Capability | Classification | Donor source | Gemini equivalent / missing behavior | Disposition |
|---|---|---|---|---|
| Clipboard Vault | UNIQUE_MISSING | `electron/clipboard-vault.cjs`, blob `94429b0094771fdad923cb4e08ab24b61d94f81f` | Existing copy helpers had no history engine. New `apps/gemini-ui/electron/native/clipboard-{vault,ipc}.cjs`, `src/clipboard/*`, Settings tab | Adapted, native/fixture tested. Personal clipboard, packaged/installed operation and owner visual acceptance UNVERIFIED. |
| Temporary cleanup | EXISTS_WITH_NARROWER_EXECUTION | `electron/main.cjs` temp cleanup; `safe-move.cjs` | `apps/gemini-ui/electron/native/{storage-vault,operation-engine,cleanup-bridge}.cjs` already support reviewed source-scoped quarantine/restoration; automatic OS-temp eligibility is separate | Preserve existing vault. No cleanup executor added here. |
| Windows repair | EXISTS_BUT_INCOMPLETE | `privileged-runner.cjs` (blob `b4e120f921a13b275fec7b5c29bc8e93364b9fba`), 8 specs in `tool-registry.cjs` | `apps/gemini-ui/electron/native/repair-bridge.cjs` diagnostics/plans/handoffs do not prove privileged mutation | Fixed executors/UAC/VM effect proof NOT IMPLEMENTED here. |
| Background automation | EXISTS_WITH_NARROWER_EXECUTION | `electron/automation.cjs` Task Scheduler adapter | Gemini `automation-runner.cjs` / `automation-scheduler.cjs` execute consent-gated foreground workflows, not durable independently authorized background tasks | Preserve foreground contract. Background adapter NOT IMPLEMENTED. |
| Windows services | EXISTS_WITH_NARROWER_EXECUTION | `privileged-runner.cjs` / `tool-registry.cjs` | Gemini `service-actions.cjs` guards signed third-party start/stop, dependencies, identity, receipts/recovery; restart/startup-policy gated | Gemini protections are stronger. No broader legacy controls imported. |
| Sensitive-file exposure | UNIQUE_MISSING | `advanced-local-services.cjs::privacyExposure` | Gemini `scan-bridge.cjs` Zone.Identifier sampling is not `.env`/key/wallet filename analysis | Metadata-only adaptation NOT IMPLEMENTED. No secret file contents opened. |
| Event clustering | EXISTS_BUT_INCOMPLETE | `advanced-local-services.cjs::clusterEventWarnings` | Gemini `system-bridge.cjs::events` filters bounded measured events but returns a flat list | Provider/ID/severity/time clustering and cautious recommendations NOT IMPLEMENTED. |
| App registry hygiene | EXISTS_BUT_INCOMPLETE | `advanced-local-services.cjs::analyzeInstalledApps` | Gemini `app-bridge.cjs` inventory/associations/leftovers exist; raw registration provenance is needed before duplicate/stale-entry claims | Additional analysis NOT IMPLEMENTED; no registry writes. |
| Duplicate keeper intelligence | EXISTS_BUT_INCOMPLETE | `advanced-local-services.cjs::enrichDuplicateGroups` | Gemini `storage-bridge.cjs` / `storage-vault.cjs` already verify exact hashes and require an explicit keeper; recommendation/rationale is separate | Preserve identity/hash/keeper rechecks. Recommendations NOT IMPLEMENTED. |

Additional comparisons:

- `buildStorageIntelligence` overlaps Gemini's existing index-backed category/tree/extension/age analysis; no second traversal is needed.
- Utility advanced blob `d0334684fcdc40b61a88f50a38c6deff86158dd3` and main advanced blob `7b317a68e1b1a93f11dd13caf8406a85559ed101` contain the same named analysis families. Main fixes preservation of measured zero reclaimable bytes. Utility is not categorically unique; do not import its `||` zero-overwrite defect.
- Gemini's hash-bound operation engine, identity/reparse safety and keeper verification supersede donor size-only cross-volume moves: GEMINI_SUPERIOR. No wholesale transplantation.

## Clipboard adaptation

Corrected donor defects: failed-rename logic deleting the temp file before copy; swallowed persistence failure; `isEmpty` tested as a property; plaintext metadata outside payload encryption; overwrite risk for undecryptable stores; overlapping saves; suppression of an unrelated next copy. Gemini encrypts the whole document, uses serialized exclusive-temp/sync/atomic-rename writes without copy fallback, exposes pending/memory/error states, locks corrupt stores, invalidates in-flight reads on opt-out, and never persists capture permission. File references copy back as **path text**, not a claimed Explorer file drop.

## Open mission scope

The other legacy recoveries, 30 additional Smart Scan capabilities, 32 troubleshooting pathways, performance-before/after engine, developer protection, packaging/installed-app acceptance and competitor comparison are not completed here. The original 181 service IDs/count remain unchanged. See `SMART_SCAN_RUNTIME_ACCEPTANCE.md` for actual local evidence and remaining gates.
