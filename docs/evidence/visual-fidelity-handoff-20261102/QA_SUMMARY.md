# Visual fidelity QA — 2026-11-02

**PARTIALLY VERIFIED. No section is visually accepted against the new references.**

## Reality and preservation

- Starting and directly queried remote main: `8871103c7fd2a274a70fe2a069bb435f2ccb12ac`.
- 769 initial dirty/untracked paths copied outside the repository with SHA-256 verification; 383,015,386 bytes; no original path missing.
- Original Qoder/owner work remains in `D:\KNOUX-Workspace\KNOuX_VISUAL_HANDOFF_CHECKPOINT_20261102-151606`. It is a file checkpoint, not a commit.

## Actual runtime evidence

- Production dist in disposable Electron profiles, actual Main + Preload + Renderer. This is not an installed-package or production deployment test.
- 56 route/theme/locale/viewport matrix states: all fourteen Day EN at 1672×941 and 1920×1080, Day AR/RTL at 1366×768, Night EN at 1672×941.
- 12 additional Home states cover EN/AR × Day/Night × all three sizes after its narrowly scoped orbit fit repair. These supersede earlier Home frames.
- Uncaught renderer errors: 0. Failed requests/HTTP errors observed: 0.
- Existing console diagnostic retained: meta-delivered CSP frame-ancestors is ignored. No “zero console errors” claim.
- Final source stability: 422 files checked; changed files during final capture: 0.
- No owner folder authorization, file open/move/delete, Registry/SCM/startup change, account connection or workflow execution occurred during these visual probes.

## Focused interactions

- `files-search-scroll-en-1366`: VERIFIED.
- `files-search-scroll-ar-1366`: VERIFIED.
- `cleanup-expand-scope-ar-1366`: VERIFIED.
- `automation-show-overview-ar-1366`: VERIFIED.

Files search/filtering and final-row selection are explicitly built-in **fixture UI** checks; they do not certify an owner-folder index. Both EN/AR short-window runs verified visible footer, nonzero result area, no tool/table overlap, last-row hit testing and no document scrolling.

## Measurement corrections

- Baseline Settings timeout was a harness selector defect: Appearance-only `settings-theme` was replaced with route-level `settings-root`; corrected baseline capture is preserved separately.
- Initial Cleanup “six controls below hero” numbers count children of a closed `<details>` disclosure. They are not visible clipping. Focused probe verifies closed visibility and opening/category controls. Final harness uses `Element.checkVisibility`.
- Automation hero is intentionally hidden in short-height editor focus mode. The existing Show overview action was exercised and its real screenshot retained in `controls-final/automation-show-overview-ar-1366.png`.
- The first focused Cleanup probe selected its inner div instead of the details element. Its failed assertion is retained in `controls/proof.json`; corrected selector and rerun are in `controls-final/proof.json`.
- Reference/runtime images have different framing/aspect ratios and are displayed without stretching. No pixel score or pixel-perfect claim is made.

## Equal bounds gate — OPEN

| Section | x | y | width | height |
|---|---:|---:|---:|---:|
| Automation | 252 | 70 | 1408 | 278 |
| Repair | 252 | 70 | 982 | 398.8 |
| System | 252 | 70 | 1408 | 375.8 |
| Services | 252 | 70 | 1408 | 398.8 |
| Applications | 252 | 70 | 1408 | 374.2 |
| Smart Scan | 254 | 72 | 978 | 335.9 |
| Startup | 252 | 70 | 1408 | 345.5 |
| Google Workspace | 240 | 56 | 1416 | 252 |
| Settings | 244 | 60 | 1398 | 252 |
| Cleanup | 252 | 70 | 982 | 463.9 |
| Home | 248 | 70 | 1412 | 350.4 |
| Organization Studio | 242 | 85 | 973 | 252 |
| Storage | 252 | 116.9 | 982 | 326.5 |
| Files | 265 | 83 | 1010 | 357.2 |

Actual Day EN geometry at the common 1672×941 content viewport still varies. Shared minimums prevent clipping but do not satisfy equal width/height/top offset. Studio shell remains separate. All section-specific artwork/composition/body-fidelity items in `section-audit.json` remain OPEN.

## Engineering checks

| Command from apps/gemini-ui | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run test:theme` | exit 0 |
| `npm run test:files` | exit 0 |
| `npm run test:storage` | exit 0 |
| `npm run test:cleanup` | exit 0 |
| `npm run test:scan` | exit 0 |
| `npm run test:startup` | exit 0 |
| `npm run test:system` | exit 0 |
| `npm run test:repair` | exit 0 |
| `npm run test:services` | exit 0 |
| `npm run test:automation` | exit 0 |
| `npm run test:settings` | exit 0 |
| `npm run test:google` | exit 0 |
| `npm run build` | exit 0 |

Earlier successful initial checks also include `test:i18n`, `test:home`, `test:navigation`, `test:workbench`, and `test:native`; full logs are preserved. Initial `test:theme` failed on role parity, then passed after repair (12/12 plus generated material bridge). Home follow-up reran theme, TypeScript and build successfully. The complete package test suite and installed app were not executed.

## Delivery

- Modified locally on main; scoped source repair and evidence/handoff artifacts created.
- No staging, commit, push, PR creation/merge or deployment by this mission.
- Existing main CI is successful at the starting SHA only; dirty source is covered by local checks, not that CI.
- Existing PR #4 remains open and its six unique donor commits remain preserved; no blind merge.
- Next: reconcile shell/header boundaries, establish equal Day bounds, then implement each distinct matching reference and whole-route continuity while retaining real actions. Follow `docs/handoffs/VISUAL_FIDELITY_CODEX_20261102.md`.
