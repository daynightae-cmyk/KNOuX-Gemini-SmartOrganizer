# KNOuX — CONTINUE VISUAL FIDELITY FROM COMMIT 4068d4e, NO MORE READING LOOPS

## OWNER MANDATE — execute existing mission now
This is an execution checkpoint created after reviewing the long OpenChamber / DeepSeek V4.1 Flash Free session. It is NOT a request for another project exploration report. Your current 59-message session already scanned the entire tree and consumed 112k/200k context without source changes at last independent audit.

**Exact authorized workspace (note the dot before worktrees):**
`D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\.worktrees\visual-owner-rebuild`

**Independently verified baseline:** `feat/knoux-visual-studio-rebuild-20261027`, `4068d4e`, guard `PASS`. 234 untracked pre-existing files, ZERO tracked source changes. Do not reset, clean, stash, replace, or blindly stage these files.

## Do the first actual patch BEFORE more discovery
**Screen 1: HOME.** Use current canonical reference `missions/VISUAL_REDESIGN_DAY_NIGHT_20261027/references/day/00_home-command-center.png` (1672x941). NIGHT home is not a separate supplied file; adapt exactly the same semantic layout with dark tokens.

Known source entrypoints already discovered (do not grep the whole repo again):
- `apps/gemini-ui/src/pages/HomePage.tsx`
- `apps/gemini-ui/src/components/home/HomeDashboardPanels.tsx`
- `apps/gemini-ui/src/visual/home-reference.css`
- `apps/gemini-ui/src/home/live.ts`
- `apps/gemini-ui/src/visual/section-fidelity.css`
- `apps/gemini-ui/src/App.tsx` imports the styling stack.

Reference target:
- Header/left rail, title and cosmic hero are bounded.
- Six measured KPI blocks aligned with reference proportions.
- Eight Command Deck destinations remain visible and connected.
- The left main stack: system overview + storage snapshot and quick access.
- Right insight, activity/recommendations, pending safe action workbench.
- At 1366x768 and 1672x941, no outer-page vertical scroll; nested lists may scroll internally; real source-empty UI must remain explicit.
- Buttons, search, theme, Arabic RTL, navigation and reduced-motion must not regress.
- No synthetic native measurements; do not replace loading/unknown with fake 128,450 or a fake healthy status.

## First 20-minute-sized development loop (execute immediately, not a time promise)
1. Read only the named HOME files and the one DAY image. Compare hero position / main two-column split / lower panels and identify the **largest geometrical mismatch**.
2. MAKE A REAL CODE CHANGE to the relevant Home JSX or scoped CSS. Prefer fixing grid minmax ratios, overflow ownership, density and semantic hierarchy over adding a fourth cascade of cosmetic overrides.
3. Run the lightweight checks, not Electron tests: from `apps/gemini-ui`, `npm run lint` (TypeScript) and `npm run build` if feasible. Use existing `scripts/visual-checkpoint.mjs home` or existing capture pipeline; do not start a parallel Electron native app or kill someone else's dev server.
4. Capture HOME DAY and NIGHT at 1672x941 and 1366x768, compare against DAY reference and the already-captured prior actual. Record objectively what remains different and whether buttons remain reachable.
5. Stage only the Home source files you edited; commit after verified result on this visual branch, NO push/merge/main.
6. Advance to Smart Scan (SmartScanPage, SmartScanHero, scan-reference.css) and then Applications, Storage, Cleanup, Startup, System, Repair, Services, one domain at a time. Read only each domain's files before modifying that domain.

## Recovery from stuck session
- Do not call unknown `tools.shell`. Your currently available terminal/read tools worked later in the transcript; use them directly. No further model tool search, source-tree dump, repeated `Read File` across 200k context.
- If you cannot issue a file edit at all through OpenChamber, clearly report **`EXECUTION BLOCKED: NO FILE-WRITE TOOL`** rather than reading forever.
- If the session has only ~88k context remaining before any code changes, start a **fresh model conversation in the SAME worktree** with this handoff file, and do not restart source exploration.
- Every output checkpoint must contain the exact changed source paths, what visual mismatch improved, actual test command and PASS/FAIL, screenshot evidence path; if no changed source, never claim progress.

## Screens to preserve and truth constraints
Files, Organization Studio and Cinematic Intro were previously accepted and remain untouched. Nine named pages still require reference fidelity. Automation lacks original approved reference: do NOT claim exact-match acceptance for it. Maintain the actual native hooks/IPC and existing source of truth.

## Answer only after a real patch
`CHANGED: ...`
`BUILD/TS: ...`
`DAY/NIGHT EVIDENCE: ...`
`REMAINING VISUAL DIFFERENCE: ...`
`NEXT: ...`
