OWNER OVERRIDE 2026-10-28: MAIN-FIRST final cutover. Any older language treating integration branch as permanent target is superseded by 08_MAIN_FIRST_MANDATE.md. M0 requires full WIP reconciliation, verified local main promotion + canonical checkout main and normal origin/main sync before new domain. After each entire domain commit directly on main and synchronize normally.

# M0 — Safe complete LOCAL merge, including work in progress
1. Stop simultaneous writers by agreement; never kill other tasks or reset/clean/stash. Identify branch, HEAD, remote and guard in every checkout.
2. Preserve all dirty tracked/untracked files, including code/evidence/assets/mission documents, with byte-for-byte SHA-256 inventory and diff snapshots outside repository. Existing snapshot D:/KNOUX-Workspace/KNOuX_LOCAL_INTEGRATION_BACKUP_20261028/snapshot-summary.json is first recovery checkpoint; refresh for edits made later.
3. Only ONE integration branch is the new source of truth. All branch HEADs which are proven ancestors of c45c381 are already committed history, no empty redundant merge required.
4. Review the three divergent visual-sprint commits c5d93a8, 1d40002, d586601 against accepted newer visual JSX/CSS: reconcile orbit/a11y/repair features and unique tests; keep original historical images in separately named evidence (not conflicting basenames). Do not use blanket ours/theirs or a fake merge strategy that silently discards unique behavior.
5. Root has 94 tracked + hundreds untracked at inventory time (mostly binary visual evidence, but 7 native source diffs and new test); live-organization has active new Storage/Cleanup WIP; visual-owner has untracked utilities. Three-way inspect each distinct code/test/asset/mission. Mark INTEGRATED, ALREADY_ANCESTOR, VERIFIED_DUPLICATE, PRESERVED_PENDING, or BLOCKED_ACTIVE_WRITER with proof.
6. Wait for actively edited live Storage/Cleanup writer to reach an explicit checkpoint; no clobber; integrate that completed snapshot into unified source.
7. Review any new branches created after the snapshot; rerun merge-base and worktree inventory. Each distinct commit/patch/assets tracked in provenance. No unmerged code-relevant WIP.
8. Run guard, types, build, contract tests, Native fixture, real isolated Electron main/preload, reduced-motion/RTL/day/night, pixel geometry, audit for security and regression. Record exact SHA/results.
9. Commit locally an M0 merge closure containing source disposition and verification. Only then label ALL_LOCAL_WORK_RECONCILED. Do not automatically delete worktrees/branches; source history and backups remain available.

Merge is currently PARTIAL, not complete: merge-tree non-destructive attempt returned content and binary conflicts. Refuse false all-done claims.
