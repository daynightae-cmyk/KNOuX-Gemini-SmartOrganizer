# FULL-STACK REFINEMENT — 08 Google Workspace

> BINDING 2026-10-30 owner instruction. Supplement, do not replace, `missions/SCREEN_EXECUTION_PACK_20261030/screens/08_GOOGLE_WORKSPACE/SCREEN_TASK.md`. This file is a TASK, not proof of implementation.

## Exact ownership
- Route: `workspace`.
- Existing renderer source: `apps/gemini-ui/src/components/workspace/GoogleWorkspaceHub.tsx`.
- Canonical domain: `missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/DOMAINS/04_GOOGLE_WORKSPACE_FULL_DOMAIN.md`.
- Service IDs: **10**. No additions or renaming; total across all domains is 181.
- Owner-approved DAY image: `missions/SCREEN_EXECUTION_PACK_20261030/REFERENCE_IMAGES_UNIQUE/9dcb4c40bacf__KNOuX Google Workspace Dashboard.png`; NIGHT image: `null`. Verify present and compare viewport; never embed a full screenshot as UI.
- Original integration handoff: `missions/SCREEN_EXECUTION_PACK_20261030/screens/08_GOOGLE_WORKSPACE/INTEGRATION_HANDOFF.json` — current NOT_AUDITED state must be refreshed from evidence, not assumed failed.
- Mandatory global contract: `OWNER_FULLSTACK_REFINEMENT_20261030/00_READ_FIRST_AND_REALITY.md` and `02_ACCEPTANCE_AND_REPORTING.md`.

## Product journey
Preserve real Sheets OAuth PKCE/DPAPI bridge and nine previously fixture-only providers; don't fake connected state or add scopes without owner consent.

**End-to-end sequence:** Connect via documented scopes and consent -> bounded data access -> service-specific sheet/mail/task/form/contact/calendar/picker/slides/chat/classroom workbench -> disconnect/revoke -> token storage/logout verification.

**Screenshot identity and original service scenes:** Distinct native-like Sheets grid, mail viewer, tasks board, forms preview, contact dossier, calendar agenda, picker, slide viewer, conversation list and classroom board, only where supported.

## Specific native + risk gate
All live Google authorization and cloud writes require separate owner approval; offline fixtures cannot be marked LIVE. Drive scopes absent unless explicitly authorized.
- Reuse actual Main/Preload/typed contracts and existing service ownership. Do not regress original tested behavior or overwrite unmerged work.
- Build real in-app controls and dedicated inspector per service: inputs -> measured outputs -> targeted actions -> feedback/errors, with a side/expanded view where suited. Unsupported operations keep their contextual scene but state clearly why they are unavailable.
- Every successful actual effect must be backed by fresh consent, exact plan, native postcondition and journal receipt on user-owned temporary test fixtures; no privileged Windows/account actions without separate owner authorization.
- Render errors, permission declined, empty source, loading, stale data, cancel, partial, success and restart state; show provenance/timestamp/freshness/units and a real cancel status.

## EXACT service-level assignments (not generic repeated cards)
1. `mission-04-01` **Google Sheets** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-01.md`.
2. `mission-04-02` **Gmail** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-02.md`.
3. `mission-04-03` **Google Tasks** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-03.md`.
4. `mission-04-04` **Google Forms** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-04.md`.
5. `mission-04-05` **Google Contacts** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-05.md`.
6. `mission-04-06` **Google Calendar** — editable trigger/policy parameters, time preview and actual runner/blocked state. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-06.md`.
7. `mission-04-07` **Google Picker** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-07.md`.
8. `mission-04-08` **Google Slides** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-08.md`.
9. `mission-04-09` **Google Chat** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-09.md`.
10. `mission-04-10` **Google Classroom** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-10.md`.

## Per-service closure protocol
For EACH ID above, inspect its canonical spec and renderer + native implementation, compare current route to exact approved DAY/NIGHT PNG, preserve existing provider and code, implement ONLY missing unique service UX/functionality, exercise distinct toolbar/inspector/keyboard controls, run native fixture + actual Windows Electron evidence, update that exact ledger row with SHA and evidence, mark visual owner gate separately. No subset of ID rows closes this domain.

## Tests to run (the result must be recorded, never presumed)
- Preflight: Git ancestry/current remote, baseline and worktrees, working-tree diff and exclusive edit ownership. Keep untracked evidence safe; no Git push/merge without separate authorization.
- Native contract and targeted domain suite, typecheck/lint, Vite build, failures and negative constraints; regressions in owning/cross-domain shared engines.
- Actual Electron dev AND packaged Windows runtime for functionality claimed packaged (not browser fixture as a substitute).
- UI: EN/AR RTL × DAY/NIGHT × 1366x768/1672x941/1920x1080, zoom 100/125/150 where supported, keyboard/focus/reduced motion, real selection and scroller checks. Capture before/after/screenshots with timestamp/SHA; compare side by side with approved source.
- Deliver a service-by-service evidence table; every claim must name commands and exit status, exact local/remote Git SHA, unverified gaps and owner visual acceptance state.

**Safe next action:** Audit the baseline and proven unique source first, then implement one cohesive end-to-end verified increment in this domain. Do not stop at design, screenshots, documentation or 1–2 attractive workbenches.