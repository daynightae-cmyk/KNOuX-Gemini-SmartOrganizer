# Real Organization Live Preview — first functional delivery

## REALITY

Implementation commit: `e819b2cad6c3437b2348a981600298fbda2a5e63`. [181-row execution status](LIVE_SERVICE_EXECUTION_STATUS_181.csv).

Starting visual baseline: `d96dcf9d9e8ba0433bc780ca59bd02d901e43e6a`, including implementation `b5a9e44`. The owner explicitly requested isolated functional work. Created `.worktrees/live-organization`, branch `codex/live-organization-20261027`. Its verifier adds only an exact path/branch exception; top-level/common-git-dir/remote checks remain mandatory and PASS. Other worktrees and their WIP were not modified.

Copied the provided mission pack from the canonical repository without regenerating it: 212 files, including 181 individual service specs and 14 playbooks, all SHA-256 identical to the source pack. The copied specifications remain unchanged; execution status lives in the repository ledger rather than rewriting specifications.

## IMPLEMENTED

The new shared `OperationEngine` orchestrates the existing hardened native Studio organization engine rather than duplicating its filesystem executor. A separate fixed `knouxOperationsV1` preload namespace exposes source/destination pickers, real incremental discovery, immutable planning, execute, cancel, history, undo preview/apply and permission revocation. Production IPC validates the actual application window, top-level sender and loaded origin before accessing any operation.

Files and Studio open the same side/expanded live workbench. Files' organization service entries and the new footer action are wired to it; Stage 6 hands off to it, and Stages 7/8 expose real execution/history entry points. Existing Files selection is carried by relative identities and intersected with a freshly measured native index; missing selections refuse the plan. Choosing a folder authorizes a scope, never an automatic move.

Native discovery events reveal category counts and source paths. The before/after trees expose exact target paths, category folder names, flat/categorized structure and review/rename/skip collision policies. Progress values come only from actual native events; unknown totals use indeterminate progress. No provider data or completion percentage is invented.

Plans bind source file identities, content SHA-256, root identities, targets, collision decisions and expiry. The renderer approves an exact plan hash, then the main process separately asks for native confirmation with operation/count/bytes/destination/hash. Execution performs exclusive target creation, read-back verification and guarded source removal. Receipts expose per-file paths, hashes, verification/state/errors and plan hash. The journal survives restart.

Undo builds a separate inverse preview with current content/identity checks, requires its own approval/hash and native confirmation, and refuses changed targets. Conflicting originals can be skipped safely. Source grants revoked through the original Studio bridge also invalidate the new operation path. The selected sources are reindexed after apply/undo, and Files/Studio refresh their measured state.

## UNIQUE WORK & RISKS

No approved Files/Studio/Intro styles or Cinematic Entry sources changed. New CSS is scoped to the live workbench. Small live-entry buttons and truthful operation-history copy were added; existing native/read-only pages and workbenches remain. Legacy plan previews stay read-only and hand off to the new content-bound flow rather than silently turning old previews into mutations.

All actual file effects in verification were inside newly created OS temporary directories named `knoux-live-owned-*`, with separate temporary Electron userData. No owner file, installed application, registry, startup entry, service or account was modified. Test fixtures and their journals were retained for inspection.

## VERIFICATION

- Workspace Guard: PASS on the exact isolated checkout.
- TypeScript `tsc --noEmit`: exit 0.
- Vite production build: exit 0; existing large-chunk warning remains.
- `node scripts/native-contract-test.cjs`: PASS. The allowlist now explicitly includes the one fixed Operations event channel; no raw IPC or generic shell API was added.
- `node scripts/live-organization-test.cjs`: 13 verified native fixture checks. Includes 40 incremental discoveries and actual moves, exact target hashes/source removal, collision keeper preservation, missing/declined/tampered approval, replay denial, changed destination refusal, 39+1 safe restores, durable journal reload, same-size changed content with restored mtime, traversal, session and cross-bridge grant revocation, cancellation and junction exclusion.
- `node scripts/live-organization-negative.cjs`: real exclusive Windows file lock refused before effects; actual worker process exited during execution, restart detected an interrupted journal and safely restored the completed move.
- `node scripts/live-organization-electron.mjs`: actual production main/preload/renderer in isolated Electron, not a browser mock or alternate application. Seven workflow checks, no recorded page errors. Includes sender rejection from an untrusted BrowserWindow, raw-path payload rejection, folder discovery/plan, UI approval, 40 verified moves, separate undo approval, all 40 original source hashes restored, single-row Files scope preservation, and side/expanded handoff from both domains.
- Live preview captured at 1366×768 and 1672×941, DAY/NIGHT. Action dock remained within the viewport and inner content scrolled. Closed Files/Studio views captured in both sizes/themes; their existing style/Intro source diff against `d96dcf9` is empty. Reduced Motion returned `none` for orbital particles.

The Electron harness substitutes only native dialog responses, selecting its newly created fixture folders and consenting to those fixture operations. The production dialog implementation has no bypass flag. Automated picker/confirmation responses do not prove manual interaction with the Windows dialogs or owner-data acceptance.

## EVIDENCE

- [Native preview DAY/NIGHT, both sizes](evidence/live-organization/live-preview-day-night.png)
- [Files/Studio preserved DAY/NIGHT views](evidence/live-organization/preserved-files-studio.png)
- [Moved receipt](evidence/live-organization/electron/moved-receipt.png), [restored receipt](evidence/live-organization/electron/restored-receipt.png)
- [Electron result, native events, exact receipts and fixture path](evidence/live-organization/electron/proof.json)
- [13 native checks](evidence/live-organization/fixture-checks.json), [lock/interruption recovery](evidence/live-organization/negative-checks.json)
- [Build output](evidence/live-organization/build.txt), [static native contract](evidence/live-organization/native-contract.txt), [visual preservation boundary](evidence/live-organization/visual-preservation.json)

## DELIVERY / REMAINING GAPS

This is the first executable Studio/Files organization slice, not activation of all 181 services. The matching capability rows distinguish fixture-tested execution from full product acceptance. No push, main merge, production deployment or owner-data operation is included.

Not verified in this delivery: packaged/installed Electron, manual native picker/confirmation interaction, 1920×1080 and 125–150% display scaling, full RTL interaction, high-volume inventory performance, cross-volume/network/cloud placeholder execution, and the remaining domains. Classification uses the existing extension-based native classifier; this work does not add media decoding. Copy intentionally retains originals and has no automatic undo; verified move undo is the supported reversible path. These boundaries remain separate from the proven temporary-file effects.
