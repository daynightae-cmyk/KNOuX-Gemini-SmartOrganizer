# FULL-STACK REFINEMENT — 07 Automation Flow Studio

> BINDING 2026-10-30 owner instruction. Supplement, do not replace, `missions/SCREEN_EXECUTION_PACK_20261030/screens/07_AUTOMATION_STUDIO/SCREEN_TASK.md`. This file is a TASK, not proof of implementation.

## Exact ownership
- Route: `automation`.
- Existing renderer source: `apps/gemini-ui/src/pages/AutomationPage.tsx` + `apps/gemini-ui/src/automation/useAutomation.ts` + `apps/gemini-ui/src/automation/AutomationServiceWorkspaces.tsx`.
- Canonical domain: `missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/DOMAINS/13_AUTOMATION_FULL_DOMAIN.md`.
- Service IDs: **12**. No additions or renaming; total across all domains is 181.
- Owner-approved DAY image: `missions/SCREEN_EXECUTION_PACK_20261030/REFERENCE_IMAGES_UNIQUE/fa3ffdc43778__Pastel Purple Automation Studio Dashboard.png`; NIGHT image: `missions/SCREEN_EXECUTION_PACK_20261030/REFERENCE_IMAGES_UNIQUE/bd3bf69c511b__08_AUTOMATION_NIGHT_1672x941.png`. Verify present and compare viewport; never embed a full screenshot as UI.
- Original integration handoff: `missions/SCREEN_EXECUTION_PACK_20261030/screens/07_AUTOMATION_STUDIO/INTEGRATION_HANDOFF.json` — current NOT_AUDITED state must be refreshed from evidence, not assumed failed.
- Mandatory global contract: `OWNER_FULLSTACK_REFINEMENT_20261030/00_READ_FIRST_AND_REALITY.md` and `02_ACCEPTANCE_AND_REPORTING.md`.

## Product journey
Keep typed DAG/dry-run and local journal; don't call a preview schedule an actual triggered run.

**End-to-end sequence:** Build graph -> validate types/permissions/cycles -> configure actual triggers -> simulate deterministically -> consent scoped nodes -> sandbox scheduler/runner -> per-node logs, failures/retries -> verified notifications/backups only when built.

**Screenshot identity and original service scenes:** Node/edge canvas, event log, schedule dial, template library, retry graph and workflow receipt separate from the simulation.

## Specific native + risk gate
Time, quiet hours, battery, retry idempotence, restart and overlapping job locks need explicit cases. No background scheduling until native verified.
- Reuse actual Main/Preload/typed contracts and existing service ownership. Do not regress original tested behavior or overwrite unmerged work.
- Build real in-app controls and dedicated inspector per service: inputs -> measured outputs -> targeted actions -> feedback/errors, with a side/expanded view where suited. Unsupported operations keep their contextual scene but state clearly why they are unavailable.
- Every successful actual effect must be backed by fresh consent, exact plan, native postcondition and journal receipt on user-owned temporary test fixtures; no privileged Windows/account actions without separate owner authorization.
- Render errors, permission declined, empty source, loading, stale data, cancel, partial, success and restart state; show provenance/timestamp/freshness/units and a real cancel status.

## EXACT service-level assignments (not generic repeated cards)
1. `auto-smart-scan` **Smart Scan Automated Workflow Flow** — live unit-labelled sensor/diagnostic charts with unavailable and stale states. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-smart-scan.md`.
2. `auto-schedule-manager` **Weekly Automation Calendar & Task Manager** — editable trigger/policy parameters, time preview and actual runner/blocked state. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-schedule-manager.md`.
3. `auto-run-history` **Automation Run History Timeline** — time-ordered source-backed events, filters, incident detail and export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-run-history.md`.
4. `auto-templates` **Workflow Template Gallery & Library** — selectable dense inventory with preview, provenance and safe drilldown. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-templates.md`.
5. `auto-schedule-plan` **Recurrence Composer & Cron Preview** — editable trigger/policy parameters, time preview and actual runner/blocked state. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-schedule-plan.md`.
6. `auto-cleanup-plan` **Safe Automated Cleanup Pipeline** — effect-aware preflight, immutable plan, consent, postcondition and auditable receipt. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-cleanup-plan.md`.
7. `auto-notify` **Notification Channel Routing Board** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-notify.md`.
8. `auto-quiet-hours` **Quiet Hours 24-Hour Dial** — editable trigger/policy parameters, time preview and actual runner/blocked state. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-quiet-hours.md`.
9. `auto-battery-policy` **Power-Aware Scheduler & Battery Gating** — editable trigger/policy parameters, time preview and actual runner/blocked state. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-battery-policy.md`.
10. `auto-retention` **Artifact Retention Policy Timeline** — time-ordered source-backed events, filters, incident detail and export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-retention.md`.
11. `auto-export` **Workflow Export & Schema Transfer** — provenance-rich report composer with redaction and reproducible export. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-export.md`.
12. `auto-backup-plan` **Backup Flow & Verification Designer** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/13_AUTOMATION/auto-backup-plan.md`.

## Per-service closure protocol
For EACH ID above, inspect its canonical spec and renderer + native implementation, compare current route to exact approved DAY/NIGHT PNG, preserve existing provider and code, implement ONLY missing unique service UX/functionality, exercise distinct toolbar/inspector/keyboard controls, run native fixture + actual Windows Electron evidence, update that exact ledger row with SHA and evidence, mark visual owner gate separately. No subset of ID rows closes this domain.

## Tests to run (the result must be recorded, never presumed)
- Preflight: Git ancestry/current remote, baseline and worktrees, working-tree diff and exclusive edit ownership. Keep untracked evidence safe; no Git push/merge without separate authorization.
- Native contract and targeted domain suite, typecheck/lint, Vite build, failures and negative constraints; regressions in owning/cross-domain shared engines.
- Actual Electron dev AND packaged Windows runtime for functionality claimed packaged (not browser fixture as a substitute).
- UI: EN/AR RTL × DAY/NIGHT × 1366x768/1672x941/1920x1080, zoom 100/125/150 where supported, keyboard/focus/reduced motion, real selection and scroller checks. Capture before/after/screenshots with timestamp/SHA; compare side by side with approved source.
- Deliver a service-by-service evidence table; every claim must name commands and exit status, exact local/remote Git SHA, unverified gaps and owner visual acceptance state.

**Safe next action:** Audit the baseline and proven unique source first, then implement one cohesive end-to-end verified increment in this domain. Do not stop at design, screenshots, documentation or 1–2 attractive workbenches.