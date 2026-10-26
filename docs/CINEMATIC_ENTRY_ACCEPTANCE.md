# Cinematic entry acceptance

Scope: `daynightae-cmyk/KNOuX-Gemini-SmartOrganizer`, cloud branch `feat/smart-cinematic-entry-20261026`, baseline `099500e204dbf9184e929f267fe0112f272ff725`. The implementation commit is the commit introducing this document; exact tested source digests are in `evidence/cinematic-entry/run-results.json`. This avoids claiming an impossible self-referential commit hash inside its own contents. Later documentation-only evidence commits do not change the tested feature.

## Local acceptance, 2026-10-26

| Gate | Result | Observed evidence |
|---|---|---|
| Existing checkout isolation, origin, branch, baseline ancestry and clean starting status | PASS | HTTPS official origin; dedicated branch from exact current main; only cloud paths |
| `python scripts/verify-workspace.py` | FAIL (expected platform restriction) | Windows canonical path guard rejects `/workspace/...`; user explicitly authorized cloud override; guard unchanged |
| Frozen dependency installation | PASS | `npm ci` with existing lock; added Playwright through npm and retained other dependency versions |
| Electron binary integrity/download | PASS | Explicit install through inherited proxy using NODE_USE_ENV_PROXY=1; bundled package checksums kept enabled |
| `npm run lint` | PASS | Repository command is TypeScript `tsc --noEmit` |
| `npm run build` | PASS | Vite production bundle; existing >500 KB chunk advisory remains |
| `npm run test:entry` model/audio unit tests | PASS | 3 tests, no skips |
| Browser interaction/visual suite | PASS | 21 tests, no skips; detailed cases in run-results.json |
| Real Home paint/mount identity, overlap and final focus | PASS | Real main DOM identity unchanged, no removal, shell opacity 1, overlay intermediate opacity asserted, inert removed only after transition |
| Gesture-only audio / repeated click / denied audio | PASS | Real AudioContext resume/oscillator instrumentation; exactly one seven-voice Enter cue despite repeated clicks; no mount/fast-entry audio |
| Renderer/native status separation, slow native bridge | PASS | Pending → explicit unavailable timeout; interface remains enterable; no capability states mutated |
| Skip/Escape, keyboard/Space, replay/persistence | PASS | Settings replay preserves Settings main and route; first/repeat/always-show flows exercised |
| Reduced motion, absent Canvas/WebGL | PASS | Immediate readiness, short dissolve; denied Canvas/audio do not prevent entry |
| Hidden tab, route change, settling, unmount | PASS | RAF pauses, stops outside Home and after settling; unmount cancels scheduled frames and pending audio |
| 1366×768 / 1672×941 / 1920×1080 × EN/AR × dark/light | PASS | 12 combinations; 36 ready/entering/Home captures; CTA bounds and overflow assertions |
| Existing `test:native`, `test:files`, `test:storage`, `test:apps`, `test:cleanup`, `test:system`, `test:repair`, `test:services`, `test:automation`, `test:workspace`, `test:settings` | PASS | 11 existing contract/fixture suites, exit 0 |
| Existing `test:studio`, `test:scan`, `test:startup` on Linux | FAIL (baseline portability) | Details below; existing scripts/providers byte-identical to origin/main |
| Native/packaged Windows entry | NOT_RUN locally | Linux cannot prove Windows provider behavior. Dedicated Windows CI job runs real Electron development + unsigned packaged acceptance |
| Existing full `desktop:smoke` | NOT_RUN locally | Requires Windows; existing screenshot flow does not dismiss the new entry boundary |
| Physical listening, target Windows GPU 60fps, full service activation | NOT_RUN | Browser tone instrumentation is not human acoustic acceptance; Home/service activation is outside this feature |

## Diagnosed baseline failures

- Studio expects `C:\Windows` to produce `STUDIO_PROTECTED_ROOT`. Linux path resolution does not interpret that as a Windows root; the existing check fails. No guard was weakened.
- Scan writes `downloaded.bin:Zone.Identifier`. On NTFS it is an ADS; on Linux it is a seventh regular file, while the test expects six. The scanner correctly observes seven in this environment.
- Startup uses `path.basename` for Windows backslash executable paths. Under Linux, it retains the backslashes, so three running-process name assertions fail. No provider/test source was changed.

`git diff origin/main -- electron apps/gemini-ui/electron apps/gemini-ui/scripts` was empty for all existing files before adding the new isolated smoke script. Their unchanged content plus the explicit fixture assumptions establish these are outside the intro implementation. Windows CI remains the correct platform gate.

An early visual run had one READY timeout while source was hot-reloaded during capture. A lifecycle test initially used read-only `window.closed` as a test counter. These development-run failures were corrected; final result records are the completed, stable runs, with no assertions disabled or expected counts reduced.

## Evidence interpretation

Curated screenshots under `evidence/cinematic-entry/` are browser renders of the implemented feature and the existing real renderer. They are tagged by viewport, locale, theme and phase. WebP encoding reduces repository size; dimensions and original PNG digests are recorded. The supplied reference PNGs remain separate and are never replayed by runtime code.

The existing Home visual preview has static KPI/service activity examples. This feature did not invent those values or validate them as native measurements. The preserved real workbenches and consent/unsupported/partial states remain source of truth. No live account, personal file, Windows service or privileged repair was touched.

## Review and merge

**DO NOT MERGE while Qoder is active in the canonical Windows checkout.** See CINEMATIC_ENTRY_INTEGRATION.md. Branch push, PR and exact CI status are reported in the delivery and any follow-up evidence update; local PASS does not imply CI or packaged Windows PASS.

## Follow-up after GitHub reconnection (2026-10-27, Dubai)

At implementation commit `c7fa4e034bffba277c68d5ce54ad608e42837165`, both push and PR runs finished successfully for browser entry, all existing Windows contract/fixture suites, and the real Windows development plus unsigned packaged entry smoke. See [browser/Windows workflow](https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer/actions/runs/40391740431) and [existing Windows suite](https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer/actions/runs/40391741239). These are remotely observed PASS results, separate from the Linux-only NOT_RUN rows above.

SonarCloud separately failed its initial quality gate. Its annotations identified oversized cognitive complexity, dialog/decoration semantics, CTA contrast and CI package-install concerns. The follow-up splits scene geometry, rendering and lifecycle into bounded helpers, separates entry controls/copy/footer, uses a native dialog and output status, strengthens CTA contrast and explicit reduced-motion CSS, and uses frozen install with dependency lifecycle scripts disabled in CI. Electron installation is an explicit checksum-verifying step. Browser CI uses the hosted Ubuntu image's existing Chrome rather than downloading or executing an on-demand npm package.

The owner advanced main independently while this branch was under review. This branch retains its original baseline and does not merge or overwrite that work. The owner must reconcile integration after Qoder is idle. Subsequent source digests and regenerated screenshots are recorded in run-results.json; the PR check list is authoritative for the follow-up commit's remote gate status.
