# KNOuX 2026-10-30 — EXACT SERVICE & DOMAIN ACCEPTANCE

This checklist applies to EVERY named service of the current domain, not just the domain overview. Put factual rows into the existing `UNIFIED_FULL_DOMAIN_EXECUTION_20261028/schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv` and/or exact current ledger only after inspecting status, ownership and write permissions; do not blindly overwrite. The audit of `SCREEN_EXECUTION_PACK_20261030` handoffs currently says `NOT_AUDITED`.

## Evidence row schema (repeat once per service ID)
`id | overview route | actual workstation component | distinct inputs | source/provider and capability | payload DTO/IPC | allowed user scope | real actions | permission/effect risk | fixtures + negative tests | Windows dev result | Windows packaged result | DAY/NIGHT/RTL capture paths | baseline SHA -> resulting SHA | acceptance state | remaining gap`

## Product standards
1. Scene: compare actual app viewport at exactly matched screenshot resolution; icon glyphs, sizes, orbit geometry, color, typography, glass layering, sidebar, card density, inspector, light and dark original references. Show evidence side-by-side or image diffs, not a self-assigned percentage.
2. Interaction: each satellite/tab/search/filter/sort/select/drag where approved/action/review/export/back/keyboard has real event semantics and visible state; assert action reaches the intended owning service. No inert buttons, decorative progress or false success.
3. Data: distinguish `LIVE_MEASURED`, `LIVE_PARTIAL`, `PREVIEW`, `OFFLINE_FIXTURE`, `AWAITING_CONSENT`, `UNSUPPORTED` with source, timestamp, scope, unit and permission.
4. Native: preserve `contextIsolation=true`, `sandbox=true`, `nodeIntegration=false`; validation and sender guard, fixed allowlisted IPC and DTO versioning; no path/command injection.
5. Effects: fixture-only real mutation tests with exact immutable plan hash, authorization to exact roots/targets, collision/symlink/locked-file/stale-plan recheck, user confirm, per-item receipts, partial/cancel/crash/restart outcomes, safe Undo only where content identity/postconditions prove it; no silent owner OS/account/data writes.
6. Quality: typecheck/build + relevant native/contract/domain/negative/regression tests; run Windows Electron dev AND packaged tests when needed; tests not run must be `NOT_RUN`.
7. Visual/interaction matrix: DAY + NIGHT, EN + AR RTL, 1366x768 + 1672x941 + 1920x1080, 100/125/150% Windows scale or zoom as applicable, keyboard/focus, reduced-motion, loading/empty/denied/offline/error/cancelled/stale/partial/finished.
8. Accessibility/perf: WCAG-aware contrast/focus, no hidden primary action, use bounded results with virtualization for large datasets, avoid particle/GPU leakage, no fake real-time polling.
9. Integration: verify preexisting Home and previously accepted domains, no lost original assets/animations, no route regression, no old effect engine replacing a newer one, no duplicate app shell, no orphaned panels.
10. Delivery: changed paths, exact before/after SHA and diff, tests with exit code and evidence locations, remaining unsupported IDs, complete service-level table, owner visual signoff flag, Git local vs published and CI status. Stop when consent/active agent/remote divergence gate blocks. Do not turn BLOCKED into PASS.

## Stage advancement
`PRESERVE -> BASELINE -> IMPLEMENT MISSING -> TEST CONTROLLED -> DAY/NIGHT REVIEW -> PACKAGE VERIFY -> OWNER VISUAL GATE -> RECORD EXACT IDS -> NEXT DOMAIN`.

A service is not accepted because a host opens or a label exists. A domain is not complete while even one required service is still staged/blocked or reference rejected. A complex restricted service can be `FUNCTIONAL_READ_ONLY_ACCEPTED` only for its proved read-only contract, never `FULL_FEATURE_COMPLETE` when its required effect is absent.