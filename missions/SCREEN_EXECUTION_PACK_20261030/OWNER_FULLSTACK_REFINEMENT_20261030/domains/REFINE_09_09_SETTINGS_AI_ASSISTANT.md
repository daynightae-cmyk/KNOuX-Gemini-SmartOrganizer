# FULL-STACK REFINEMENT — 09 Settings & AI Assistant

> BINDING 2026-10-30 owner instruction. Supplement, do not replace, `missions/SCREEN_EXECUTION_PACK_20261030/screens/09_SETTINGS_AI_ASSISTANT/SCREEN_TASK.md`. This file is a TASK, not proof of implementation.

## Exact ownership
- Route: `settings`.
- Existing renderer source: `apps/gemini-ui/src/pages/SettingsPage.tsx` + `apps/gemini-ui/src/components/chat/KNOuXAssistantChat.tsx` + `apps/gemini-ui/src/components/chat/ApiKeySetupModal.tsx`.
- Canonical domain: `missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/DOMAINS/14_SETTINGS_ASSISTANT_FULL_DOMAIN.md`.
- Service IDs: **8**. No additions or renaming; total across all domains is 181.
- Owner-approved DAY image: `missions/SCREEN_EXECUTION_PACK_20261030/REFERENCE_IMAGES_UNIQUE/55e51928c655__KNOuX SmartOrganizer Settings Dashboard.png`; NIGHT image: `null`. Verify present and compare viewport; never embed a full screenshot as UI.
- Original integration handoff: `missions/SCREEN_EXECUTION_PACK_20261030/screens/09_SETTINGS_AI_ASSISTANT/INTEGRATION_HANDOFF.json` — current NOT_AUDITED state must be refreshed from evidence, not assumed failed.
- Mandatory global contract: `OWNER_FULLSTACK_REFINEMENT_20261030/00_READ_FIRST_AND_REALITY.md` and `02_ACCEPTANCE_AND_REPORTING.md`.

## Product journey
Reconcile non-secret persistence, consent, secure key vault, model profiles and actual AI provider proxy; don't store keys in renderer/localStorage.

**End-to-end sequence:** Profile -> accessibility/theme/locale -> secure provider enrollment -> narrowly scoped consented AI request -> bounded streaming/error/rate behavior -> privacy/status -> export/import verified non-secret configuration.

**Screenshot identity and original service scenes:** Genuine settings panels, model/status selector, secure credentials flow, session history/data policy, previewable theme tokens and live assistant work area.

## Specific native + risk gate
No OAuth/AI calls, credential persistence or live account reads without explicit owner approval. Encrypt secrets with native OS provider; never log key or response containing private content.
- Reuse actual Main/Preload/typed contracts and existing service ownership. Do not regress original tested behavior or overwrite unmerged work.
- Build real in-app controls and dedicated inspector per service: inputs -> measured outputs -> targeted actions -> feedback/errors, with a side/expanded view where suited. Unsupported operations keep their contextual scene but state clearly why they are unavailable.
- Every successful actual effect must be backed by fresh consent, exact plan, native postcondition and journal receipt on user-owned temporary test fixtures; no privileged Windows/account actions without separate owner authorization.
- Render errors, permission declined, empty source, loading, stale data, cancel, partial, success and restart state; show provenance/timestamp/freshness/units and a real cancel status.

## EXACT service-level assignments (not generic repeated cards)
1. `mission-14-01` **Engine & Turbo Hardware** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-01.md`.
2. `mission-14-02` **AI Copilot & Provider Keys** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-02.md`.
3. `mission-14-03` **Google Workspace Hub** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-03.md`.
4. `mission-14-04` **Automated Protection & Guards** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-04.md`.
5. `mission-14-05` **Neon Glass Customization** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-05.md`.
6. `mission-14-06` **Language & Locale** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-06.md`.
7. `mission-14-07` **Profile Backup & System Restore** — verified inverse/restore timeline with hash/state conflict guard. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-07.md`.
8. `mission-14-08` **AI Assistant Chat** — dedicated real service inspector with its own inputs, dataset, results and action handling. Exact controlling spec: `missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/14_SETTINGS_ASSISTANT/mission-14-08.md`.

## Per-service closure protocol
For EACH ID above, inspect its canonical spec and renderer + native implementation, compare current route to exact approved DAY/NIGHT PNG, preserve existing provider and code, implement ONLY missing unique service UX/functionality, exercise distinct toolbar/inspector/keyboard controls, run native fixture + actual Windows Electron evidence, update that exact ledger row with SHA and evidence, mark visual owner gate separately. No subset of ID rows closes this domain.

## Tests to run (the result must be recorded, never presumed)
- Preflight: Git ancestry/current remote, baseline and worktrees, working-tree diff and exclusive edit ownership. Keep untracked evidence safe; no Git push/merge without separate authorization.
- Native contract and targeted domain suite, typecheck/lint, Vite build, failures and negative constraints; regressions in owning/cross-domain shared engines.
- Actual Electron dev AND packaged Windows runtime for functionality claimed packaged (not browser fixture as a substitute).
- UI: EN/AR RTL × DAY/NIGHT × 1366x768/1672x941/1920x1080, zoom 100/125/150 where supported, keyboard/focus/reduced motion, real selection and scroller checks. Capture before/after/screenshots with timestamp/SHA; compare side by side with approved source.
- Deliver a service-by-service evidence table; every claim must name commands and exit status, exact local/remote Git SHA, unverified gaps and owner visual acceptance state.

**Safe next action:** Audit the baseline and proven unique source first, then implement one cohesive end-to-end verified increment in this domain. Do not stop at design, screenshots, documentation or 1–2 attractive workbenches.