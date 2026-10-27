# START NOW — KNOuX TEN-SCREEN DAY/NIGHT VISUAL SPRINT
Status checked 2026-10-27, Dubai. Read 00_FAST_TRACK_VISUAL_SPRINT.md first.

## Previous Qoder task: STOP, DO NOT RE-RUN LONG SMOKE
- Latest native feature branch: feat/gemini-missions at 35e2071cba6a311c48a23527ea24ae83994fd2b8, committed and pushed.
- Canonical Windows checkout had no tracked uncommitted changes at inspection.
- Dev Electron smoke at 06:43 local: PASS all checks.
- GitHub CI on this commit: FAIL because workflow runs npm run test:google but package.json lacks that script. Every preceding step passed. This belongs in deferred QA, NOT a blocker for VISUAL SPRINT.
- Main branch was still at 86cf321a910943faf6b2e5438cb027c46924865d. DO NOT claim feature is merged to main.
- Qoder application may remain open. If its agent is still generating, user should click Stop in its chat; do not kill the whole app or wipe its session.

## Begin visual development immediately
1. Work in ONE already authorized isolated feature/cloud checkout, never switch branches or write source inside the Qoder Windows checkout.
2. Fetch fresh refs. Base the visual feature branch on the latest compatible published implementation including feat/gemini-missions 35e2071; integrate completed cinematic-entry PR #1 (last observed 5bfb33aa70137b5097841af1da950f5f024612b3) FIRST INTO THE VISUAL BRANCH. Keep main untouched.
3. Read 00_MASTER_VISUAL_DIRECTIVE.md and TASK_QUEUE.md; read the matching mission file and its TWO images: references/night/NN_slug.png and references/day/NN_slug.png.
4. Prioritize actual React/CSS visuals NOW: larger readable cards; responsive premium 3-zone layout; glass depth; violet orbital action controls; correct disabled/loading/running states; native hooks must remain truthful and permission-gated.
5. One screen at a time: implement both themes, take one night + one day preview at 1672x941, fix glaring visual issues, quick compiler/build, commit + push to SAME isolated visual branch, proceed automatically to next screen. No owner-approval waits.
6. Do NOT run 15-minute full native smoke or packaged acceptance after every page. Leave exhaustive CI/QA to the post-sprint Qwen/DeepSeek pass. Don't claim release-ready if not validated.
7. Do not delete files, run repairs, change services, sign in to accounts, change native security/IPC contracts, force push or merge to main.

## Sequential screens
01 Organization Studio; 02 Files; 03 Smart Scan; 04 Applications; 05 Storage; 06 Cleanup; 07 Startup; 08 System; 09 Repair; 10 Services.

## Handoff
At the end, provide completed screen list, screenshots, commit SHAs, missing native/UI functionality, and deferred QA including missing test:google. No long narrative between tasks: implement the next screen.
