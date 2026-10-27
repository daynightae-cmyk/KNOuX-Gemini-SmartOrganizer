# KNOuX SMARTORGANIZER — FINAL PRODUCTION CLOSURE EXECUTION MANDATE
**Authoritative agent entrypoint (2026-10-27). Do the work; no planning-only deliverable.**
Primary user outcome: a genuinely functional, polished, safe Windows desktop organizer, especially **user-approved automatic file organization**. Never claim a screenshot, mock, fixture, preview, plan or disabled button is working execution.

## Required first reads, in order
1. `missions/PRODUCTION_READINESS_AUDIT_20261027.md` — independently checked blockers and release gates.
2. `missions/PRODUCTION_AUDIT_SNAPSHOT_20261027.json` and `missions/PRODUCTION_NPM_AUDIT_20261027.json` — point-in-time evidence, revalidate before changing code.
3. `missions/STANDALONE_AUTONOMOUS_ENTRY.md` and `missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md`.
4. `missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md` and `missions/15_REAL_SERVICE_ACTIVATION_MISSION.md`.
5. `docs/SERVICE_CAPABILITY_MATRIX.md`, `docs/SERVICE_REGISTRY_EVIDENCE.md`, `docs/SERVICE_WORKBENCH_ACCEPTANCE.md`, `docs/PRODUCT_GAP_AUDIT_20261027.md`.
6. `missions/MISSION_SEQUENCE_PROGRESS.md`; then each current 01–14 `*_FULLSTACK_MISSION.md` INCLUDING its latest activation addendum.
7. `missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/`: `TASK_QUEUE.md`, `DESIGN_SYSTEM_AND_QA.md`, `00_HOME_FIRST_IMPLEMENTATION.md`, `00_BRAND_CIRCULAR_LOGO.md`, `REFERENCES_MANIFEST.json`, ten 01–10 screen specs and their exact DAY/NIGHT images.

## Ground truth and repo ownership
- Canonical standalone repo ONLY: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`. Product subproject: `apps/gemini-ui`. Remote: `daynightae-cmyk/KNOuX-Gemini-SmartOrganizer`. The separate K:\ legacy product is READ-ONLY historical context.
- Last independently verified acceptance HEAD: `516f0ed0ff41a39e59b98938faa7a14d3d199063` on `integration/final-acceptance-20261027`; DO NOT assume it is still current.
- Existing concurrent branches/worktrees: `integration/visual-final-closure-20261027`, `integration/visual-day-night-20261027`, `feat/knoux-visual-home-follow-20261027`, Codex `feat/knoux-visual-day-night-sprint-20261027`; never reset, clean, stash, force-push, delete, checkout over, or overwrite another agent's dirty files.
- Original mission docs contain outdated branch instructions (`feat/gemini-missions` only and "no worktrees") and screenshots/checklists sometimes show unchecked tasks although code advanced. Do NOT "correct" historical drift by destructive cleanup. Use current Git, owned branch, application source and newest runtime evidence as truth. Reconcile owners and preserve exact SHA/patches first.
- Preserve all existing user mission assets, references, old proofs, file scans, caches, `.worktrees`, live sessions, and untracked `visual-sprint.rar`. Never stage binary archives or screenshot churn en masse. New source must remain in approved canonical repo only.
- Current user authorization is to BUILD, REVIEW and TEST with **isolated/disposable fixtures**. It is NOT authorization to mutate their real files/apps/registry/startup/services/network/repair Windows, to connect OAuth accounts, spend on AI APIs, share private data or release public artifacts. Require explicit separate consent at the exact runtime action.
- Do not promise unattended future completion or claim success prematurely. If blocked by external credentials/signing/owner consent, finish every independent safe track, label `BLOCKED_USER_ACTION` and report precise missing input.

## STAGE 0 — Freeze audit and establish non-destructive ownership
1. Run `python scripts/verify-workspace.py` in canonical repo. Compare tool policy (which may assume old feature branch) to actual checkout; do not bypass a failing path/remote safety gate. Identify safe canonical route to work.
2. Capture status/branch/upstream/HEAD/log/worktrees/remote SHA, GitHub visibility, CI, inflight processes, dirty tracked and untracked source/evidence. Record active writers and never modify their current files. Freeze read-only SHA-based audit evidence; isolate acceptance work using existing dedicated owned branch/worktree if possible.
3. Maintain a file ownership matrix for Qwen Electron vs Codex visual; never run competing Electron/Playwright smoke instances. Keep backups immutable, do not create duplicate clones.
4. Re-run snapshot collector when repo is stable. Do not use legacy K:\ CI, generic `git add -A`, `npm audit fix --force`, cleanup scripts, elevated execution or blanket process termination.

## STAGE 1 — Fix the ACTUAL Electron native smoke release blocker FIRST
Latest explicit receipt in `apps/gemini-ui/visual-evidence/platform-00/native-smoke-summary-dev.json` has **exitCode=1, receiptOk=false, 12 failed assertions**:
`smartScanLayoutOk`, `appsLayoutOk`, `cleanupLayoutOk`, `startupLayoutOk`, `systemOk`, `repairOk`, `servicesOk`, `servicesLayoutOk`, `automationOk`, `studioWorkbenchOk`, `studioWorkbenchLayoutOk`, `screenshotOk`.
- Inspect `scripts/native-smoke.cjs`, the matching receipt `native-smoke-dev.json` (7000+ lines), any trace file, timeout/wait rules, System WMI scan, IPC state and screenshot assertions.
- Differentiate `Unknown: ChildProcess.kill` reported by a model's command runner from a genuine Electron child exit; use a reliable native PowerShell/Node runner with isolated temp `userData`, fixed cwd, versioned build, stdout/stderr files, bounded watchdog, exact exit code, process tree ownership and privacy-safe cleanup. Do not kill unrelated Electron/Chrome user sessions.
- Diagnose the 12 checks independently with minimal deterministic reproduction and real app data. Fix product defects, not the assertion; if harness bug, prove with runtime traces and add a regression. Intro must not obstruct acceptance tests or force fake bridge readiness. Do not silently relax gates.
- Re-run fresh dev AND packaged native smoke on EXACT source SHA; require `exitCode=0`, `receiptOk=true`, `all checks=true`, screenshot files attached and clean reproducibility. Any failure means release stays BLOCKED.

## STAGE 2 — Security and dependency hardening
- Real `npm audit` found **one HIGH direct Electron vulnerability** at 43.4.1, fix available; audit evidence under `missions/PRODUCTION_NPM_AUDIT_20261027.json`. Patch Electron to a vetted build outside all reported advisory ranges, align `package.json`, lockfile and `electron-builder.config.cjs electronVersion`, then rerun all IPC/preload/native/packaged acceptance. NO reckless bulk dependency upgrades.
- Maintain `contextIsolation:true`, `sandbox:true`, `nodeIntegration:false`, `webSecurity:true`, CSP, fixed typed/versioned allowlisted IPC, origin/sender validation, explicit permission handlers, no raw IPC or generic command/PowerShell/exec, no unsafe `shell.openExternal` input.
- Threat-model input injection, symlink/junction traversal, TOCTOU stale plans, UNC/special paths, protected Windows locations, elevation/UAC, external URLs, OAuth callback and CSRF/PKCE, loops/timeouts, logging/PII, data exports and persistence.
- Reconcile GitHub repo currently reported **public** with mission document claiming private; do not change visibility on your own. Audit full branch/tag history and distributed artifacts for credentials, OAuth client material, account data, Windows usernames/paths, screenshot PII, debug logs. Redact receipts and restrict data collection.
- Generate vulnerability/SBOM/license/source provenance and CI dependency gates; no High/Critical remaining in production dependency audit. If advisories irreducibly blocked, HOLD RELEASE and report exact advisory and mitigation.

## STAGE 3 — Finish FUNCTIONALITY before polishing idle demos
Mission ledgers: 14 missions, **181 advertised entries**, overlapping **150 registry/surface rows**. Latest workbench ledger at audit: 92 AUDIT_REQUIRED, 44 MEASURED_READ_ONLY, 25 PARTIAL, 17 BLOCKED, 2 UNSUPPORTED, 1 CONNECTABLE_AWAITING_CONSENT, zero IMPLEMENTED_AND_TESTED in the *workbench status* column. Registry evidence ledger independently lists 76 measured, 57 partial, 10 consent, 4 unsupported, 1 tested, 2 blocked.
- Build 181→150 reconciled mapping table keyed by stable service ID: promised user outcome, mission, class A/B/C/D, exact React workbench route, native provider, action provider, risk/approval, permission, test fixture, postcondition, cancellation, journal/undo, packaged runtime and status. Map aliases; never invent 331 separate engines.
- FINISH Mission 15A for each of the 181 advertised entries: host with pinned resizable side and expanded full modes; 1366 readable context; keyboard/RTL; persistent selection/filters; unique purposeful controls; actual provider outputs; approved action gates. Reuse existing host already integrated in Files, Studio, Storage, Smart Scan, Apps, Cleanup, Startup. Complete System 36, Repair 12, Services 12, Automation 12, Settings and Home; Google workbenches as real providers become available. Don't rewrite or duplicate accepted work.
- FINISH Mission 15 activation **in mission-specified dependency order**:
  `03 Studio -> 06 Files -> 07 Storage -> 02 Smart Scan -> 05 Applications -> 08 Cleanup -> 09 Startup -> 10 System -> 11 Repair -> 12 Services -> 13 Automation -> 04 Google -> 14 Settings -> 01 Home`.
- Every Class A observational outcome: verified measured value, provenance/time/coverage, useful query/filter/export/drilldown, real empty/loading/partial/denied/offline/cancel; unsupported sensor is honestly disabled, not faked.
- Every Class B/C mutation: authorize exact file/resource/scope; real read; fingerprint immutable plan; explicit per-run consent; validation of symlinks/junctions/protected scopes/collision/stale hash; fixed allowlisted typed native executor; bounded progress/cancel; postcondition/hash or effective OS state; durable journal; truthful rollback/undo where technically possible, explicit irreversible warning when not. Test positive, negative, denial, stale, interruption, partial failure and undo in owned disposable fixture or mock Windows/SCM/VM only.
- Every Class D external: OAuth least privilege, expiry/refresh/revoke, securely stored tokens only in main/OS vault, idempotent API, quotas, rate limits, offline/denied/expired state; no simulated success or unapproved live connection.

### Prioritize the actual flagship user workflow
`Organization Studio`: choose/sync explicitly authorized folder -> categorize photos/videos/documents/audio/archives visibly and fast -> filter/inspect/multi-select -> configure rules and destinations -> dry-run exact source→target with collisions/size/confidence -> user reviews and approves immutable plan -> real copy/move/rename on disposable folders -> progress/cancel/verified hash/effect -> durable operation journal -> real undo where supported. Make this genuinely smooth and reliable; Files/Search, Storage and Cleanup must share secure primitives, not compete. No silent disk-wide walk or rename.

### Domain-specific mandatory outcomes
- 01 Home: measured KPIs, fresh data provenance, verified deep links/context, indexed global search, pending approvals / receipts, no invented space saving.
- 02 Scan: quick/deep scoped search, findings evidence, duplicates/keeper selection, larger files, read-only health, safe handoff into execution-owner.
- 03 Studio: authorized plan, apply, hash/postcondition, undo, multi-file conflict safety (highest priority).
- 04 Google: working Sheets connector after consent; Gmail, Calendar, Tasks, Contacts, Drive/Picker, Forms, Slides, Chat, Classroom need real least-privilege supported providers/workbenches OR documented user-approved scope deferral. Never claim connected without auth.
- 05 Apps: inventory/signers, official uninstall/updates/WinGet, safe handoff/selected batch, verification; no false uninstall undo.
- 06 Files: Everything-like index performance, scoped search/filter, select, open/reveal, metadata, copy/move/rename/apply/undo.
- 07 Storage: measured treemap/large/duplicates; verified reclaim basket; truthful unsupported SMART/TRIM/fragmentation.
- 08 Cleanup: reviewed candidates, quarantine/delete/restore, before/after bytes, safe scheduling only after Automation executor.
- 09 Startup: bounded autorun/task/service changes, protected entries and reversible restore.
- 10 System: measured live pulse/36 tools with real history where claimed, safe network/host action gates and provenance; no fake hardware sensors.
- 11 Repair: fixed command allowlist, proper UAC, DISM/SFC/restore/network action only on authorized sandboxed/VM test plan, transcript and after-state, reboot states, no fake undo.
- 12 Services: SCM dependency/protected policy and 12 tools; explicit verified start/stop/restart/config with mock SCM and disabled real OS until approval.
- 13 Automation: typed triggers/DAG, queue/scheduler, idempotent durable worker, crash resume, receipt/cancel/pause, no default unattended destructive jobs.
- 14 Settings/AI: persisted honest preferences, OS secret vault, provider proxy, explicit network/billing consent, allowlisted tools, retries/revoke and theme parity.

## STAGE 4 — Match OWNER'S VISUAL REFERENCES, not arbitrary redesign
- Approved refs live in `missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references`: 11 DAY images (Home + 10), 10 NIGHT (the ten sections), 1 transparent circular logo. Use same semantic React tree between day/night. The Home-night reference is existing source behavior, not a new local dark PNG.
- Verify each real screen against its matching reference at SAME viewport. For every named section create reference/actual paired captures + mismatch ledger: Home, Studio, Files, Smart Scan, Applications, Storage, Cleanup, Startup, System, Repair, Services. Separately inspect Automation, Google Workspace, Settings/Assistant, onboarding and every per-service dock/expanded workbench.
- Preserve KNOuX deep navy night / pearl lilac day, luminous 3D circular logo without square backing, restrained glows, meaningful orbital tool icons/actions, readable fonts 14px normal text/12px metadata, dense but not microscopic.
- Ten dials (not Home), actual satellite visibility/click/focus/nav for all sections at 1366, 1672, 1920, 125% zoom, Windows display scaling; never pass a hidden `display:none` dial by only counting DOM nodes. Center never implies unauthorized OS mutation.
- EN/AR with full RTL, paths/numbers in LTR, no clipped or offscreen footer, no decorative layers covering fields, meaningful empty/error/unsupported/pending state, contrast, screen reader, Tab/Shift+Tab/Escape, reduced motion, focus return, sane scrolling and tooltips. No hardcoded fake hardware data from concepts.
- Critical intro lifecycle: `CinematicEntry` currently keeps real workspace mounted `inert` behind its overlay, while intro leaves section-specific titlebar visible. Neutralize header context during splash or otherwise visually isolate without remounting workspace; verify enter/skip/replay, saved prefs, single-instance behavior, focus/ARIA, audio choice, native bridge state, clean startup and smoke profile determinism. DO NOT duplicate navigation or falsify READY state.
- Evidence acceptance must pin exact git SHA/build, theme/locale/viewport, real native vs fixture state, screenshots, render errors, visual diff, interaction outcomes, permission states; do not overwrite prior proof with partial runs.

## STAGE 5 — Build/UX/soak/release engineering
- Evaluate app boot latency, 2 MB+ renderer JS bundle, 1.31MB circular logo and static asset weight; use safe code splitting/local logo derivative only after visual equivalence and no alpha loss. Avoid global CSS `!important` conflicts and endless particle/canvas loops; reduced-motion/pause hidden, memory/cpu/handles, cancellation under slow WMI and 100K+ file index fixtures.
- Run every packaged and isolated native suite: `npm run lint`, `npm run build`, all `test:native,test:studio,test:files,test:storage,test:scan,test:apps,test:cleanup,test:startup,test:system,test:repair,test:services,test:automation,test:workspace,test:settings,test:home,test:workbench,test:google,test:navigation,test:entry`. Validate failures by preserving logs, NOT masking. Add security negative and file effect tests.
- Validate reproducible development Electron AND packaged Electron `desktop:smoke` / `desktop:packaged-smoke`, screenshot comparison and no test-driven account/OS mutation. CI must run relevant gating suites on exact release SHA with an isolated Windows runner; avoid runner 30-minute capture timeout by meaningful bounded slices/reuse, no weakened assertions.
- Current builder is PREVIEW, explicitly unsigned, `target:['dir']`, `signAndEditExecutable:false`. For production, implement reproducible signed installer with version/icon/appId, user-scoped install/update/uninstall, artifact hashing, signer verification, migration/rollback, no secrets bundled, offline smoke, SmartScreen/reputation disclosures. Never request or expose signing private key in chat or source; signing only using authorized secret tooling/certificate.
- Test Windows 10/11 supported architectures, 100%/125%/150% scaling, HDPI, permissions/UAC, non-admin, no internet, denied folders, slow provider, partial success, cancellation, app restart/crash and power interruptions. Preserve user files, profile, OAuth tokens, settings through upgrades as specified.

## STAGE 6 — RELEASE EVIDENCE, NOT AN ASSERTION
Produce and continually update:
- `docs/PRODUCTION_CLOSURE_LEDGER.md`: each of 181 entries, mapped registry, class, source, UI, permission, native executor/effect proof, postcondition/journal, day/night, accessibility, dev/packaged/CI, status, blocker.
- `docs/PRODUCTION_VISUAL_REFERENCE_MATRIX.md`: every reference, screenshot URI, pixel/structural differences, manual approval and deliberate true-data deviations.
- `docs/PRODUCTION_SECURITY_AND_DEPENDENCY_AUDIT.md`: advisories, Electron fix, IPC threat model, privacy/PII, license/SBOM, GitHub visibility, code signing.
- `docs/PRODUCTION_NATIVE_SMOKE_TRIAGE.md`: every original failed check's root cause, code fix, regression and exact green receipt.
- `docs/PRODUCTION_RELEASE_CHECKLIST.md`: release SHA, test/CI/installer/signature, supported Windows, manual owner consent gates, known limitations, rollback and go/no-go.
- Compact machine-readable summary with `PASS / FAIL / BLOCKED_USER_ACTION / NOT_TESTED` per G0–G7 and screenshots/hashes. All evidence must be SHA-linked and reproducible.

### Hard GO criteria
1. No unresolved High/Critical advisory or security hole; Electron patched, signed installer verified.
2. Current exact-SHA native and packaged Electron smoke green, every asserted check true, no fixture masquerading as real data, no missing screenshot.
3. Zero `AUDIT_REQUIRED` product workbench entries; every required capability either genuinely tested as Class A/B/C/D or explicitly user-approved de-scoped/unsupported with a visible alternative. Zero required broken/inert buttons.
4. Real flagship file organization apply/undo proven on disposable fixtures with collision/permission/interruption tests and reliable journal. Other included effectful services similarly proven.
5. All screens, workflows, intro, dock/expanded panels and ten orbital wheels visually/functionally accepted across light/dark/EN/AR/RTL/required sizes/accessibility.
6. Signed installer, clean-room test, CI required checks and provenance.
7. No unauthorized operation on real user's files, OS, apps, external account or API; owner accepts final scope and distribution.
If ANY fails: `NO_GO`, preserve deliverable branch, do not merge into main or publish. If owner approval/certificate/OAuth is missing: `BLOCKED_USER_ACTION`, not PASS.

## Safe execution and reporting contract
- At each coherent step: minimal patch, test, evidence, reviewed commit to OWNED branch, normal push, verify remote SHA and CI. Never hide failing gates behind green lint or screenshots.
- Reuse previously accepted code/tests, do not start duplicate application/repo/visual redesign; prioritize genuine native outcomes then visual polish.
- If output/tool time limits interrupt progress, checkpoint what is done and report exact next test/command/file, without false progress claims or background promises.
- Finish with GO/NO_GO status, Git commit SHA, diff, executable installer evidence if any, 181-service statuses, 12 native smoke failure resolution, exact remaining `BLOCKED_USER_ACTION` asks and a short next-step handoff.
- NEVER merge into `main`, change repo visibility, sign/publish an installer, perform live OAuth/account access or mutate owner's actual system without separate explicit owner approval.
