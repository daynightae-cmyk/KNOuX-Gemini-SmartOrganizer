# KNOuX — FAST TRACK VISUAL SPRINT (priority override)

## Goal
Codex should spend this session BUILDING the ten actual KNOuX screens in day+night themes, not spending most of it on test suites, waiting for approvals, reports, or researching unrelated features. The 20 PNGs in references/day and references/night are visual composition targets, NOT proof of real functionality or real numerical data.

**This sprint policy supersedes older task wording that requires full native/CI suites or owner signoff after EVERY individual page. The worktree isolation, permissions, privacy, security, and truthful native-state rules remain mandatory.**

## Step 00 — integrate parked Codex cinematic entry FIRST
- Use an already authorized ISOLATED cloud/feature checkout; not the active local Windows branch feat/gemini-missions that Qoder is editing.
- Fetch current origin/main and cinematic branch feat/smart-cinematic-entry-20261026 / PR #1 (last confirmed SHA 5bfb33aa70137b5097841af1da950f5f024612b3; recheck live).
- Create/use ONE feature integration branch: feat/knoux-visual-day-night-sprint-20261027.
- Integrate cinematic entry INTO THAT BRANCH FIRST, retaining upstream features, App/Settings, package scripts, native bridges, providers. AVOID merging to main during Qoder's active work. Do not touch Qoder's dirty checkout.
- After minimum compile/build proof, continue directly into UI work. Do not wait on a prolonged CI run.

## One-pass visual implementation loop — Screen 01 to 10
1. Open current page + TWO references: references/day/NN_slug.png and references/night/NN_slug.png.
2. Inspect only necessary React/CSS and real action hook, then IMPLEMENT premium page now. No prolonged roadmap or pixel-diff pipeline.
3. Follow matching geometry, legible large text, premium responsive 3-zone layout, contextual inspector, generous card proportions, proper contrast and smart 2-theme styles.
4. Primary CTA should invoke actual safe existing app functionality, or show a clear honest unsupported/permission state. Do not fabricate system metrics, fake scan completion, nonexistent files, or risky actions.
5. Capture only one actual NIGHT screenshot and one DAY screenshot at 1672x941; fix major visible defects. Check 1366x768 when fast.
6. Run minimal local build/compiler smoke. Defer exhaustive unit/browser/native/packaged/CI suites to the end or a later Qwen/DeepSeek QA pass. Record SKIPPED/BLOCKED honestly.
7. Commit and PUSH the completed page directly to the SAME isolated visual integration branch (not a PR or merge to main). This means every finished page is instantly integrated into the next page's baseline.
8. Continue to next screen AUTOMATICALLY. No owner signoff after each page.

## When a screen is difficult
Don't sink the entire session into missing backend services or intricate tests. Implement the core visual shell and supported interaction truthfully, note incomplete features in ONE line, commit/push usable progress, and move to the next screen. Never claim unsupported actions are ready.

## Deferred integration/QA pass
At end, add concise VISUAL_SPRINT_DEFERRED_QA.md with untested behavior, missing native actions, exact touched files/commit SHAs, and steps for Qwen 3.8 / DeepSeek V4.1 to repair after Codex. Label all untested items NOT VERIFIED. Full Windows packaged tests, extensive visual combinations, SonarCloud and owner approval happen in the later release gate.

## No compromise
NO switching/resetting/cleaning/stashing Qoder's branch. NO force pushing. NO merging to main while Qoder has unsaved concurrent work. NO deletion, uninstalls, service changes, elevated repairs or Google account access during UI design. NO secret leakage. No disabling native security checks. No screenshot-as-interactive-UI shortcut.

## Output after a page
Screen NN | both themes implemented | commit SHA | minimal build PASS/FAIL/NOT RUN | outstanding gap.
Then immediately continue coding the next screen.
