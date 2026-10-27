# KNOuX SmartOrganizer — FIRST IMPLEMENTATION: HOME COMMAND CENTER

**Owner priority 2026-10-27:** Start with the HOME PAGE and official new circular logo. Only after Home is visually complete and saved, resume the ten Codex visual recovery missions 01–10. Do not start at Organization Studio this time.

## Verified newly installed assets
- DAY / Home reference: `references/day/00_home-command-center.png` — 1672x941, SHA-256 `a777e4847a8bf8b44a6153b7795f05d325e23b3904025951a5b0015c0166569d`.
- DAY / official circular brand: `references/brand/00_knoux-circular-logo-day.png` — 1254x1254, SHA-256 `c02c3ba9e83f297dd86eba38a1ee2929685d3a105d9a9a63e726933d100d0feb`.
- Dark Home reference: user supplied a dark Home Command Center screenshot in the conversation, **not installed as a new nighttime PNG**. Inspect existing actual dark Home and preserve the same information architecture as the provided new DAY image. Do not claim a nonexistent night Home reference file.

## Protect source
- Repo: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`.
- Isolated Codex worktree: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\.worktrees\visual-sprint`.
- Visual branch: `feat/knoux-visual-day-night-sprint-20261027`.
- Inspect latest `git status` before touching source. Existing WIP in App.tsx, RepairPage.tsx, system-reference.css and screenshots MAY be uncommitted. Create safe patch/file backup without reset, stash or clean; do not overwrite other agent's work.
- Locate the actual Home page components, hooks, style sheets and active navigation through source discovery. Earlier known styling includes `apps/gemini-ui/src/home-command-center.css`, but verify all paths, imports and current semantics.
- Do not recreate the app or cinematic startup entry.

## Use the realistic DAY reference as canonical structure for both themes
The attached day image is a professional **concept**, not a screenshot of live output. Implement with actual React components, no giant PNG-as-UI. Day and night MUST render same widgets/positions/interactions:
1. Global top search and header, clear KNOuX identity; clean active Home navigation.
2. Home Command Center headline and restrained orbit/cinematic header motif (not the ten section action wheels artificially repeated on Home).
3. Six measured KPI tiles: System Health, Indexed Files, Space Reclaimable, Active Automations, Apps Monitored, Services Healthy. If a value is unavailable, show its honest state — no hardcoded 92/100, 1,248,632 files, 48.6 GB, 12 automations, 358 apps or 241/271 services.
4. Today's Command Deck: Smart Scan, Organize Files, Applications, Storage, Cleanup, Startup, System, Repair. Each routes to real existing section; no fake action.
5. Lower-left System Overview with tabs, trend chart and Storage Snapshot from measured data where available.
6. Lower-center Quick Access with Recent Files/Recent Folders/Pinned, only authorized actual evidence; clear empty/permission states.
7. Right-column KNOuX Insight, Recent Activity & Recommendations, Pending Safe Actions; evidence-backed and clearly preview-only for effectful operations.
8. Keep all major sections clear and legible at 1672x941, robust scroll at 1366x768. No clipped cards, tiny text, covered panels, duplicated global search bars if they conflict.
9. Provide keyboard focus, responsive behavior, AR/EN/RTL where supported, reduced motion, accessible color contrast.

## Circular logo — actual integration
Open and inspect the new transparent circular PNG, then integrate it in Home branding/header/navigation as appropriate. Keep its entire circular silhouette visible without square corners, square tiles, fake strokes or rectangular backing. Render via PNG alpha + `border-radius:50%; object-fit:contain` as appropriate; do NOT crop text out of the emblem or replace the approved logo with a fabricated K icon. If full text is too small at 32px, use the round emblem at a legible size alongside actual accessible text rather than editing the approved image. Preserve existing brand assets used by cinematic entry or other routes unless their owners/requirements explicitly demand replacement. Avoid overwriting global assets destructively.

## Completion criteria and next tasks
- Real DAY Home matches reference section structure, clean white/lavender design and circular logo.
- Real NIGHT Home contains precisely the same semantic widgets and layout, dark palette only; compare to existing dark screenshot and adapt it, don't build a second unrelated page.
- All command deck links, quick access, selections, Home filters and insights remain hooked to actual supported behavior.
- Verify in browser/Electron, take actual `Home / day` and `Home / night` 1672x941 screenshots. Quick compile/build. Do not run full native packaged smoke for this UI stage.
- Commit/push Home changes on the existing visual feature branch. Record SHA and any backend limitations honestly.
- **IMMEDIATELY CONTINUE** Organization Studio → Files → Smart Scan → Applications → Storage → Cleanup → Startup → System → Repair → Services via the existing local day/night pair missions. Rescue and polish Codex code, no rewrite.
- No main auto-merge. No native mutation executors or Google consent. 
