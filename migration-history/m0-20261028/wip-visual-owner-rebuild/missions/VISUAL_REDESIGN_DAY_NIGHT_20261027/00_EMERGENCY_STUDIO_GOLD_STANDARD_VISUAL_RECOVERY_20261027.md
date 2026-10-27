# KNOuX — EMERGENCY VISUAL RECOVERY: STUDIO IS THE GOLD STANDARD
**Owner escalation: 2026-10-27. This mission supersedes all previous "screenshots PASS = visually done" assertions.**
**Scope: REDESIGN LAYOUTS to actually match owner-approved DAY/NIGHT reference PNGs; PRESERVE the current real React/Electron data and functionality.**
**No automatic merge into main. Do not touch real owner Windows files/registry/services.**

## WHY THIS EXISTS — Evidence that invalidates visual-completion claims
Owner supplied a 106-second live-screen recording, timestamped 2026-10-27 14:41, showing multiple actual live pages and scrolling. An independent contact-sheet and representative full-resolution frame review showed:
- Organization Studio (video ~28.5s and ~100–105s) is **significantly closer** to its reference in arrangement, orbital instrument, source/catalog grouping and persistent side inspector.
- Home (~10–20s), Files (~96s), Scan (~24s), Storage (~37s), System (~41–47s), Automation (~51s), Services (~73s), Repair and other pages use disjoint header/KPI rows, long vertically stacked sections, misbalanced right rails, undersized repeated cards and/or unrelated shell styles. They are NOT reference-complete.
- Dark/Light parity of arrangement and shell styles is not proven from screenshot existence. Scrolling to discover primary sections is NOT the approved command-center composition.
- The existing `apps/gemini-ui/scripts/visual-preview.mjs` only measures `document.documentElement.scrollWidth > innerWidth` (horizontal overflow), input coverage, orbit visibility and some clipping. IT DOES NOT ASSERT VERTICAL PAGE/MAIN SCROLL GEOMETRY OR SCREEN REFERENCE FIDELITY. Consequently its prior "46/46" rows and orbital passes do NOT certify the owner's requested visible viewport compositions.
- Existing screenshot receipts may have only one/partial viewport or reduced-motion; trust only exact-SHA fresh measurements and reviewed PNGs.
- Studio implementation is traceable to exact Git commit `d4eba0da18b02ec653a669ba0a0339071acff57f` on 2026-10-27 07:53:39 +04, message `feat(visual): reconstruct studio composition from paired approved references`. It added `src/visual/StudioReferenceOverview.tsx`, `studio-reference.css`, `ReferenceAtmosphere.tsx`, edited `src/studio/StudioPage.tsx`, and created a `studio-visual-check.mjs` + real screenshots. **Git author is account knoux x, not an AI model identifier. Do not invent which model wrote it.** Use the exact code style/architecture/commit as design anchor.
- At audit, canonical D repo is `integration/final-acceptance-20261027` HEAD `516f0ed`, **DIRTY** with active Electron agent's `src/features/cinematic-entry/entry.css` + many live screenshot/JSON modifications. Codex's separate `.worktrees/visual-sprint` HEAD `c5d93a8` is ALSO DIRTY with Repair/SmartScan/evidence. Do not touch unowned files or kill active test processes.
- User explicitly rejected current non-Studio layouts; PRIOR VISUAL PASS SHOULD BE RECLASSIFIED AS `TECHNICAL_SMOKE_ONLY / VISUAL_REJECTED_BY_OWNER`. Never mark 10/10 visual acceptance without owner proof.

## INVIOLABLE SETUP / provenance
1. Read this file in full, `DESIGN_SYSTEM_AND_QA.md`, `REFERENCES_MANIFEST.json`, `TASK_QUEUE.md`, `00_HOME_FIRST_IMPLEMENTATION.md`, `00_BRAND_CIRCULAR_LOGO.md`, each section 01–10 spec, and the 22 local reference PNGs under `references/day`, `references/night`, `references/brand`.
2. Read `missions/PRODUCTION_READINESS_AUDIT_20261027.md` and `missions/00_PRODUCTION_CLOSURE_MASTER_20261027.md`; visual recovery cannot falsify Native Bridge metrics or change Windows security.
3. Freeze Git remote/local SHA and statuses; identify explicit file ownership, active agents, branch conflicts and original proof hashes. Do not reset/clean/stash/force-push/overwrite evidence. Owner's requested roles: current Qwen handles Electron/native only; visual agent handles screen layout on an isolated owned visual branch/worktree. Existing Codex WIP is not disposable.
4. If the **same source files** are actively edited by another agent, do NOT write concurrently. Keep the task on a separate branch/worktree and hand off a semantic reviewed merge at the end. Only coordinate necessary collision; no global server/process termination.
5. Keep all native hooks/IPC/auth state, routes, real provider data, workbench interactions, History/Undo preview honesty, and event wiring intact. Visual redesign MUST NOT revert Mission 15A nor pretend Phase 15 action engines are complete.

## FIRST: UNDERSTAND WHY STUDIO WORKS AND OTHERS DO NOT
1. Diff `d4eba0d^..d4eba0d` and read `StudioReferenceOverview.tsx`, `studio-reference.css`, `StudioPage.tsx`, `studio-visual-check.mjs`, the referenced day/night compositions.
2. Extract only the *principles*: a cohesive bounded 3-zone/instrument layout, concentrated primary action, contextual source/library/tools, persistent decision inspector, deliberate hierarchy, equal attention to typography, minimal duplication, section-specific orbital dial.
3. Diagnose actual page-wide vertical scroll chain: Electron content rectangle -> global titlebar -> sidebar -> app main -> section root -> workbench host. Identify which ancestor's `height/min-height/overflow`, giant hero/KPI grid, margins or 100vh rule causes outer page to exceed viewport. Identify largest scrollable ancestors with DOM bounding boxes, scrollHeight/clientHeight, computed grid/flex constraints. Studio has its own `main > .knx-studio-reference` overflow:auto; do not assume even Studio is fully viewport-safe without measuring.
4. Write `docs/OWNER_VISUAL_REJECTION_ROOT_CAUSES_20261027.md` identifying viewport geometry mismatches and the exact CSS selectors/components responsible, with before screenshot links. NO edits until trace supports the cause.

## FIX THE ACCEPTANCE GATE, not its output
Create/upgrade `apps/gemini-ui/scripts/visual-preview.mjs` or a companion independent Playwright test to assert at EACH 1366x768, 1672x941 and 1920x1080 in both themes + EN/AR:
- Main overview viewport anchoring: top-level `html/body/#root/app shell/main/route overview` must not require PAGE-WIDE vertical scrolling to reach PRIMARY layout blocks or actions. Measure `document.documentElement.scrollHeight - innerHeight`, body/root/main scrollHeight/clientHeight and screenshot-visible bounding boxes. Include allowed tolerance <=4px only when the design genuinely uses a fixed viewport route; never exempt the page by forcibly hiding overflow.
- Header/nav+main command view fit: title, orbital dial/core+all satellites, major KPIs, task deck/register context, always-visible inspector/primary action/footer must be reachable/visible WITHOUT PAGE scroll at 1366x768 in the default overview. If a feature cannot fit, use responsive reflow, tabs, compact mode or focused dock with REAL interactions — not tiny unreadable text, clipped controls or `display:none` for advertised tools.
- Large real datasets MAY scroll INSIDE obvious bounded tables/lists/inspector drawers with keyboard/wheel scrolling and a visible scroll affordance. Inner scrollbar does not equal global page endless scroll. Never discard real data, disable scroll for a long list or obscure action bars.
- At 125% Windows zoom (and 150% spot check), RTL and reduced motion, preserve access without cutoff. Test 14px body/12px metadata floor; no compressed 9px copy, no clipped labels, no overlay collision, no page horizontal overflow.
- Structural similarity: reference vs actual same viewport; record hero/grid/orbit/rail bounding rectangles, ratios, card count, sequence, font sizes, perceptual visual differences, actual data deviations. Capture a half-opacity overlay/diff image for human review; DO NOT fake numeric pixel-accuracy percentages or copy screenshot as full UI wallpaper. Rule: all critical areas/controls within intended reference zones with no severe overlap/absent component. Manual owner approval remains required to call it a match.
- For full content beyond viewport, ensure deliberate **internal** scroll owner, not accidental page-level scrolling; screenshot top and internal-scrolled states to prove reachability.
- Keep click/focus/Escape/nav/orbital destinations and disabled/unsupported statuses tested; no fake KPI or permissions, no implicit destructive native mutation.
- Do NOT mark PASS simply because screenshot file exists, Vite builds, `scrollWidth<=innerWidth`, or orbit DOM has 45 satellites.

## IMPLEMENTATION ORDER — do NOT redo accepted Studio needlessly
**PILOT**: Rebuild the 02 Files overview using Studio-derived layout principles (DO NOT clone Studio literally). Prove its DAY/NIGHT reference match + viewport-fit + real Files search/selection/side/full workbench. Present actual screenshots with original references side by side, evaluate differences, patch until visually compelling and functional. This is the quality bar for the rest. If the pilot fails acceptance do NOT launch 9 more mediocre pages.
Then:
A. Home (reference image + brand): command deck + 6 KPIs + insight + recent activity, balanced dense but readable, no endless overview; do not invent data.
B. Smart Scan: measured scope/scan command and findings with visual orbit and inspector.
C. Applications: premium software command center, persistent app dossier, useful multi-action filter, real status.
D. Storage: atlas/treemap+orbital instrument and per-volume context, no disconnected stacks.
E. Cleanup: safe clean-room stage, risk/candidate ledger/preview, persistent reclaim decision panel.
F. Startup: autorun register, risk/control panel, orbit, clear protected gates.
G. System: live pulse instruments, graphs, service/network/hardware contextual panels.
H. Repair: rescue Codex's current source, use approval-gated console/plan/diagnostics; do not stomp their Repair WIP.
I. Services: actual SCM register/graphs + correct six-satellite dial + permission/preview rail.
J. Automation, Google Workspace and Settings: maintain premium design consistency with dedicated interactive workstation layouts; Google nine unimplemented providers must be honestly marked disconnected/unsupported until real.
K. Studio: final regression and minor targeted corrections against its own reference only.
For ALL pages implement the actual DOM/composition to match the respective local DAY/NIGHT picture while preserving domain-specific semantics. No generic 12-column dashboard with random cards and giant blank margins, no wallpaper screenshot pretending to be app.

## LAYOUT ARCHITECTURE for non-Studio screens
- Stable `AppShell` with titlebar and sidebar outside a single viewport-height route canvas (respect Electron window/OS scaling and existing CSS ownership). Use correct available height, `min-height:0` and `min-width:0` on grid/flex descendants, explicit `grid-template-areas` and bounded inner panels where justified. Avoid `height:100vh` on content under existing header and sidebar when it yields extra total height.
- Three purposeful zones based on the image: (1) section identity, scope and main actions; (2) central orbital instrument and measured work stage; (3) persistent inspector/outcome/permission panel. Secondary tools appear as compact functional grid, tabs or detail dock, NOT 30 tall boxes in an endless main scroll.
- Adapt to 1366 not by shrinking all text or hiding the wheel, but by reallocating columns/rows; 1920 can breathe, 1366 must still be a beautiful complete operating console. Exact per-section structure derives from its own reference, not identical Studio HTML.
- One coherent theme-token system for dark navy/violet and pearl daylight, no overlapping CSS authority for orbit, no unreviewed global `!important` hacks. Preserve transparent no-square original KNOuX brand artwork with actual loaded src.
- Native state: unavailable sensors show `—`, explicit permission/unavailable; preview actions are visibly previews. Do not fabricate counts/health percentages or pretend that native mutations exist.

## MANDATORY DELIVERABLES / HARD PASS
1. A current, honest `docs/OWNER_VISUAL_REFERENCE_ACCEPTANCE.md` row per Home + 10 orbital + Automation/Google/Settings/onboarding, linking exact PNG reference, versioned actual DAY/NIGHT at 1366/1672/1920, viewport geometry, feature behavior, RTL/125% checks, owner-detected delta and closure proof.
2. The Playwright gate must FAIL if the primary overview relies on outer vertical page scrolling, if primary controls go below fold/are masked, if orbital satellites are missing/hidden, if names/focus labels are illegible, or if the measured inner scrollers cannot be used. Add regression for scrollbar, zoom and long-dataset cases.
3. A source-level responsibility ledger for each CSS layout/section (no accidental cascading theme hacks).
4. Same-page Before/After 1672x941 and 1366x768 pairs, night/day, native truth, real interactivity verified. One manually reviewed pilot accepted BEFORE batch completion. Do not say 10/10 purely on automated PASS.
5. Minimal commits/push to owned visual branch with no unapproved merge into `main`; preserve the Electron agent's source changes and screenshots. Final release still requires native/security/functional gates separately.
6. Concise result: Studio origin commit `d4eba0d`, exact changed files, screenshots, measured page-scroll failures before/after, what remains and real GO/NO-GO visual verdict.

## START HERE
(1) Compare Video observations + Studio at `d4eba0d` vs current 02 Files to isolate layout root cause.
(2) Implement hard **vertical viewport-fidelity** test (prior horizontal-only gate is insufficient).
(3) Deliver ONE exceptional Files pilot before touching the rest.
Keep running sessions intact; no fake green, no new app, no background promises. 
