# Main consolidation and DeepSeek execution handoff — 2026-11-03

## Verified integration boundary

Started on canonical local `main` at `4c8aeb8ae3bd252cabeb97fcdfe7d70e17900406`.
Live remote main was `8871103c7fd2a274a70fe2a069bb435f2ccb12ac`.
Home/Search, theme harness, mission ledger, one screenshot and untracked
specification/evidence work were present. They were preserved.

Normal merge `21595ee2612041ec513583cb32dcf7a8910a9e1c` makes Qoder's complete
branch through `230dbfed4aa3c0ee71f1875d214e06fec36b9cd2` an ancestor of main.
The two AI commits were already cherry-picked before this task. The merge
adds the Google read providers and scope/UI tests without replacing Startup,
Home or any completed Codex inner workspace.

Manual conflict review preserved both AI and Google namespace registrations.
Automatic merging also duplicated the AI types and preload exposure. These
duplicates were removed only after comparing their content, and the AI test
now rejects duplicate `knouxAiV1` exposure.

The root `START_HERE_DEEPSEEK.md` is the active entry point. The C: checkout is
no longer the implementation destination. Existing refs were not deleted or
rewritten; no new branch or backup was created.

## Codex visual preservation — owner's primary requirement

| Domain | Implementation commit | Current disposition |
|---|---|---|
| Living Glass: all 14 headers | `41a3768bb2b83111fa7e29aa38473d9980ca6e14` | Ancestor; original source/artwork retained |
| Smart Scan | `8ff81311e0b1cfae7c80080baea4d8338512fbef` | Ancestor; specialized tools retained |
| Files | `518ec7fe8f796f29198aa81aafef684726b4cd6a` | All source files from this visual commit unchanged |
| Organization Studio | `8cf9d96892e90ee8adb46064de90e200fcc3c178` | All source files unchanged |
| Applications | `e86fbf659c391b2a0dadb354ef7abcc6667ebe39` | All source files unchanged |
| Repair | `ef25624bbf40a915aa38ca27e62b9263755982b3` | All source files unchanged |
| Cleanup | `11875da98b460ecc4ac28fcee1ff9ee14d0790d7` | All source files unchanged |
| Storage | `0c853c9a66fb6e39317c0c13dc22d89aec62f995` | All source files unchanged |
| Startup | `a1aacd89ce69d9d5e70afe2ae7b8984c8f8a437b` | All source files unchanged |

Smart Scan's later three-file differences are shared CSS extraction into
`components/workbench/service-stage.css`, scoped selectors, reusable test-ID
prefixes and RTL arrow corrections introduced during Files integration. They
are not a replacement of its service renderers. See the actual diff and
`docs/evidence/consolidation-20261103/visual-preservation.json`.

All `inner-workspaces-20261102` files remain in their original locations.
Historical main verification receipts and native-runtime proofs exist for all
eight domains. They have their own SHAs and scopes; not all visual acceptance,
packaged-app behavior or service effects are certified by those receipts.

## What is newly tested

`docs/evidence/consolidation-20261103/checks.json` records the complete local
verification batch, including initial failures. `reruns.json` and
`rerun-scan.log` record successful corrections/reruns. Do not conceal the
first TypeScript/AI duplicate failures or the initial Smart Scan timeout.
The timeout cleared on an unchanged-code isolated rerun; no timeout threshold
or native executor was weakened.

`electron.json` proves **real development Electron Main + preload + renderer**:
14 routes rendered, no page errors, the fixed AI/Google/shell IPC calls
returned valid envelopes, and Home search opened/closed with the keyboard.
It used a disposable profile and connected no account. It is not a full
service-effect test, visual-reference approval, installed-app or release proof.

The older Qoder whole-app smoke failed. Its independent AI DPAPI probe passed
in its documented scope; this does not turn the old whole-app smoke green.
The new compact runtime check is separate evidence.

## Remaining product work — do not rebuild completed features

1. System's existing 36 specialized measured workspaces still need Phase II
   interior integration, following the preserved CompactServiceDock and
   LiveServiceStage approach. Then Services, Automation, Google, Settings, Home.
2. D13 Automation: audit the **existing** runner, foreground scheduler,
   activation/approval and all service-specific results end-to-end. The old
   `codex/service-workspaces-20261101` implementation is already in main.
3. Google now has scoped Main-process read adapters/UI for the products.
   Real Google OAuth/account/API proof still requires configured client,
   explicit grants and a live account. Provider/unit tests use controlled
   responses; never label these as live-account verification.
4. AI requests and credentials use Main. Real paid-provider connectivity was
   not tested with an owner key. Preserve session-only default and explicit
   encrypted-storage opt-in.
5. Home Search WIP was retained and tested. Storage denial/corruption is
   handled; old source coverage clears when the query changes. This is not
   completion of all Home services.
6. Review every original service ID against its actual UI → IPC → provider →
   result/persistence/consent path. No 181-service completion claim exists here.

## Historical sources and the limit of the consolidation claim

The read-only source-content audit scanned 22 existing preservation/worktree
roots with no read errors. `source-audit.json` identifies 461 files whose raw
or LF-normalized content did not match the current checkout or reachable main
history **at audit time**. This is a candidate list, not proof of 461 missing
features: it includes old donor/prototype pages, older versions of current
files, generated reports and operational utilities. For example, inspected
old StartupBridge and StorageVault versions are subsets of newer native work.

These historical files were **not deleted** and were not blindly installed
over Codex's approved visual baseline. Their complete semantic disposition is
still open. Consequently, do not claim that every historical backup file has
been functionally merged, or delete whole old preservation roots yet. Resolve
the candidate list by feature/diff, retaining current consent and native paths.
This limitation is distinct from the verified Qoder-branch and eight-domain
visual integration above.

The original supplied ZIPs stay in Downloads. Their specification documents
were imported into canonical `docs/specifications/owner-package-20261103/`
with SHA-256 provenance. Existing `_spec_review` was **moved**, not copied, to
`docs/specifications/review-20261103/`; its original authoring and contracts
remain available. Historical snapshots and branch instructions rank below
the current owner mandate and current source.

## Cleanup boundary

Only reviewed byte-identical Electron runtime files in two inactive historical
package directories were removed. Every deletion has a SHA-256-equal retained
canonical runtime file in `runtime-cleanup-result.json`. The result records
138 files, 236,582,324 logical bytes removed and the measured free-space change.
The historical `app.asar` files, unique source, all inner-workspace evidence,
approved references, owner data, credentials and operation journals were excluded.
Those two historical package directories are no longer complete runnable
packages; their application archives remain retained. No deployment occurred.

## Delivery verification

Use `docs/evidence/consolidation-20261103/delivery.json` for observed final
local/remote SHA and exact-SHA CI. If that receipt is absent or CI is pending,
publication is not yet certified. Always refresh mutable Git facts before work.
