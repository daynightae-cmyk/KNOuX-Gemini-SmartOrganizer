# KNOuX — REAL SERVICE FUNCTIONALITY STANDARD
## Priority amendment to all 14 full-stack missions

Canonical repo: D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer
Canonical GitHub: daynightae-cmyk/KNOuX-Gemini-SmartOrganizer
Active branch: feat/gemini-missions; task library: missions/.

The KNOuX user wants a functional Windows desktop utility, NOT only read-only dashboards, fixtures, previews, plans and colored badges. Earlier green CI and scoped milestone acceptances remain valid as historical engineering evidence, but cannot be treated as FINAL PRODUCT ACCEPTANCE for a service whose promised outcome is actual execution.

## Four service classes — assign each advertised service correctly

A. OBSERVATION / DIAGNOSIS: Real authorized measured data, useful sort/filter/drilldown/export/report, real refresh/cancel/error states, provenance, accurate performance. Read-only IS functionally complete if this is the user's actual desired outcome.
B. REVERSIBLE ACTION: Real fixed native executor behind exact resource selection, detailed preflight risk/conflict preview, fingerprinted immutable plan, per-operation consent inside app, bounded operation with progress, postcondition verification, durable journal, real restore/undo where technically possible. Plan-only is PARTIAL.
C. DESTRUCTIVE / PRIVILEGED ACTION: Safe supported OS/vendor mechanism, protected defaults, explicit per-action user consent and UAC when needed, irreversible warning, effect verification; no claims of undo for irreversible actions. Never auto-elevate.
D. EXTERNAL / CONNECTED ACTION: Real OAuth/connection and revocation, least privilege scopes, secure credentials outside renderer, authenticated API calls after separate consent, idempotency/quotas/rate limits and honest offline/error states.

Implementation and controlled fixture tests ARE authorized now. Actually modifying the owner's files, installed apps, registry, startup/services, network settings, performing repairs, connecting cloud accounts or charging an external API is NOT authorized without a separate user decision at the time of use. Build and verify real action code using disposable owned test fixtures, mock SCM/VM and test-only profiles. Do not hide executors behind permanently disabled buttons. App user must be able to intentionally authorize safe supported real actions later; no blanket overnight execution on owner data.

## Per-service execution contract

Each original service ID must have a unique user outcome, meaningful specialist UI, proven native/API provider, correct permission tier, error/empty/partial states, tested functionality and honest implementation status.
Never replace special services with generic explanations or fake universal modals. Reuse proven Studio/Files/Storage/Windows native engines and fixed typed versioned IPC allowlists with contextIsolation/sandbox/validated sender, schemas and structured errors. No arbitrary shell, generic exec endpoints, raw ipcRenderer exposed to React, privileged command interpolation or unsanctioned powershell.
For mutations: discover authorized scope -> actual read -> risk preview -> immutable plan bound to selected resources and fingerprints -> explicit specific user approval -> validated fixed native execution -> per-item progress and bounded cancellation -> postcondition check -> durable journal -> recoverability where feasible.
Refuse path escape/symlinks/junctions, protected OS locations, stale approvals, changed hashes/mtime and destination conflicts; preserve originals/quarantine with metadata if the operation supports recovery. Record partial failures; never claim success for a preview or invented percent.
If platform/hardware/vendor API cannot support a capability, state UNSUPPORTED with precise reason and user-facing alternative. Do not fake SMART, thermal, Google, antivirus or rollback.
Each action service needs disposable fixture end-to-end tests of actual effects and undo/irreversible safeguards; positive and negative authorization, permission denial, stale-plan, traversal, cancellation and interruption. Typecheck/build/screenshot/native read smoke alone is not enough. Test packaged Electron too.
Performance requirements: responsive UX, paging/virtualization, limit concurrency/memory, cancel reaches actual native worker, pause/resume when meaningful; full Arabic RTL and light/dark across 1366x768, 1672x941, 1920x1080.

## Required honest status for EVERY existing service ID

Maintain a single docs/SERVICE_CAPABILITY_MATRIX.md inside this repo, using service ID and columns:
mission | service_id | user's actual desired outcome | class A/B/C/D | live data provider | action provider | UI action | consent/risk | execution test fixture | verified postcondition | journal/undo | observed runtime | status | missing dependencies.

States: IMPLEMENTED_AND_TESTED (actual intended functionality and effect tests in disposable fixtures); MEASURED_READ_ONLY (real observation only; insufficient if action promised); PARTIAL; CONNECTABLE_AWAITING_CONSENT; FIXTURE_ONLY; UNSUPPORTED; BLOCKED. "No user data touched" is an excellent safety result, but is NOT evidence that an action service works. A green CI alone is NOT evidence of a complete action service.
Track section-level and service-level completion separately. Never mark mission product complete if its core action services have no executor or rollback/irreversible safety semantics.

## Sequence without discarding already earned milestones

Existing missions 00V/00P/03/06/07/02/05/08/09/10/11/12/13 were already accepted within narrower read-only/preview scopes. Preserve all source, history and successful test evidence. Reassess gaps as PRODUCT ACTIVATION BACKLOG, not fake the past.
Finish current safe Mission 04 Google Workspace, then 14 Settings/Assistant, then 01 Home. Then run an ordered functional activation pass:
03 Studio -> 06 Files -> 07 Storage -> 02 Smart Scan -> 05 Applications -> 08 Cleanup -> 09 Startup -> 10 System -> 11 Repair -> 12 Services -> 13 Automation -> 04 Google Workspace -> 14 Settings -> 01 Home.
Only skip an individual service after evidence proves it already meets the proper class. Do not blindly repeat accepted read-only implementations.
No new branches, clones, worktrees, project copies, external mission folders or parallel backups. Continue in existing canonical repository and branch; normal reviewed commit/push/CI/new main fast-forward as already authorized. Do not mix old Root CI.
If account credentials, API approval or an actual privileged OS operation is needed to perform a *live* end-user acceptance test, keep a consent-ready implementation, mark the live gate separately BLOCKED_REQUIRES_USER_ACTION, and proceed with independent safe development. Never pretend to have performed an unauthorized real action.

## Product completion definition

An observational service must answer a real practical user question. An action service must LET THE USER DO THE ACTION after deliberately approving it, with tested underlying executable implementation and honest limits. A connected service must have real authorization and functional API integration when connected. All services need service-specific outcomes rather than read-only theater. The app is NOT production-ready until required packaging/signing, security, supported hardware/accounts and real-user consent/manual gates are honestly satisfied.

Priority: real user outcomes > pretty dashboards > synthetic numbers. Do not compromise user safety to force a checkbox to green.
