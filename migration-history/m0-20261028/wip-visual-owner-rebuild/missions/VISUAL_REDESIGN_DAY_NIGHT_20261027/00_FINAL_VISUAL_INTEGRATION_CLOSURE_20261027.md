# KNOuX — FINAL INTEGRATION CLOSURE: Live Services WIP + 10 orbital screens

## Verified checkpoints (2026-10-27)
- Integration `integration/visual-day-night-20261027` at `96544ec`, pushed and clean in `.worktrees/integration`.
- Qwen refinement `feat/knoux-visual-home-follow-20261027` at `92c103f`, pushed and clean in `.worktrees/qoder-visual`.
- Codex `feat/knoux-visual-day-night-sprint-20261027` at committed `c50bb8b`, but ACTIVE DIRTY WIP in `.worktrees/visual-sprint`: App, Repair, OrbitalControl, Studio, System, ServicesPage, services.css and screenshot files.
- DO NOT confuse this D-drive repository with the separate K-drive product repository, which has another main/CI history.
- Existing integration's `docs/evidence/visual-sprint/services/preview.json` reports `orbit:null` and no circular emblems (although lettermarks were visible); therefore claims of ALL TEN functional orbital wheels are NOT established.
- Codex WIP adds a Services OrbitalControl with 6 satellites mapped to existing services catalog IDs: services-inventory, services-search, services-dependencies, services-diagnose, services-state-history, services-config. New Services hero CSS hides the wheel below 1120px; owner requires responsive orbital access instead of silently losing tools.
- Existing proof (39 satellites / 9 dials) DOES NOT cover Services wheel; previous 46/46 screenshot rows demonstrate basic renderer geometry, not complete functional parity.

## Mission for integration agent — EXECUTE, do not restart design
1. Pause competing writes through coordination, but DO NOT terminate another agent or modify either agent's dirty worktree. Reinspect status + file mtimes immediately before creating the final delta. If Codex still actively writes the same Services files, keep a separate branch and avoid overwriting.
2. Create a NEW non-destructive backup outside repo source of the CURRENT Codex WIP, including `git diff --binary`, untracked source, screenshot manifests, timestamps and SHA-256. Keep the older snapshot untouched. NEVER reset, clean, stash or remove that WIP.
3. Create a new clean integration-follow-up worktree/branch from `96544ec`, e.g. `integration/visual-final-closure-20261027`. Do not edit `.worktrees/integration` in place if another agent relies on it; do not alter `main`.
4. Compare the NEW WIP against what `96544ec` already contains. Bring forward ONLY unique source changes, starting with `ServicesPage.tsx` and `services.css`. Preserve Qwen's navy restraint, brand, Home layout and Codex's integrated Orbital Engine/Repair. For shared App/System/Studio files, semantic three-way review, not blanket patch/overwrite.
5. Services orbital MUST appear in BOTH day and night, on standard 1672x941 and 1366x768. At narrower width, use accessible responsive reflow, compact wheel or visible equivalent tool navigation; never `display:none` all six tools without a keyboard/mouse alternative. Do not create a second, duplicated service toolbar that changes meaning.
6. Confirm the six satellite callbacks reach the verified real Services tool IDs and expose honest unavailable/preview/permission states. Center action must not promise SCM writes. No start/stop/restart/startup-type mutation without a real authorized native executor.
7. Include Services in `scripts/orbit-behaviour-proof.mjs` and any visual/brand probe that previously skipped Services. For every section with an orbital interface, capture per-satellite enabled/disabled/navigate/focus outcomes, click errors, core state and active selection. The exact total counts must come from the actual updated runtime, not from the old 39 satellites.
8. Check that `orbital-engine.css` is the ONLY owner of `.knx-orbit*` visuals: no legacy `!important` overrides; dark matches `html:not([data-theme=light])`. Ensure Home and 10 section DOM topology identical across day/night, with same widgets and route wiring. Verify logos (no square backings) in Home and Services.
9. Retake Services day/night at 1672x941 and 1366x768; spot check Studio, Repair and System where WIP changed. Run quick typecheck/build and behavior proof. If capture fails, report exact error rather than invent PASS.
10. Inspect remote Unsplash references in Studio; replace with local permitted fixtures or explicit placeholders if practical. Optimize 1.31MB circular logo only if a verified pixel-equivalent derivative preserves approval; otherwise track as nonblocking performance item.
11. DO NOT stage or commit `docs/evidence/visual-sprint/visual-sprint.rar`. DO NOT delete reference PNGs, worktrees, backups or user files without separate authorization.
12. Commit/push only reviewed changes to new integration follow-up branch. Deliver comparison against `96544ec`, changed source paths, screenshots, proof JSON, branch SHA and remaining blockers. DO NOT merge to `main` automatically.

## Hard stop conditions
- Another process is writing the same files concurrently.
- Semantically incompatible live modifications are detected.
- Real SCM or native mutation would be required to pass a visual test.
- Missing evidence for Services behavior, day/night parity or validation.
In such cases preserve work, isolate the change and report the blocker; no destructive shortcuts.

## Completion bar
An orbit shown as a decorative shape is NOT completion. Services requires a real visible accessible six-tool dial or fully equivalent responsive control, verified callbacks, truthful data state and measured screenshot evidence. Full visual CI / production readiness remain separate gates.
