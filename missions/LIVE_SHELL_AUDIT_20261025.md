# KNOuX Gemini — Live Shell Audit (Read-only handoff, 2026-10-25)

**Evidence, not closure.** Audited read-only while Antigravity was working. No application files edited by this audit.

## Git/runtime baseline observed

- Branch: `feat/gemini-missions`
- HEAD: `c0bf2ee6066faabaf3d683f57ad3c11cb212bec2`
- 18 modified React/UI source files (working tree dirty); 15 untracked `screenshot_*.png` preview files.
- Vite development server listening `127.0.0.1:3000`, HTTP 200.
- `npm run lint` TypeScript check: exit 0 at time of audit.
- Visual parity to approved references and fresh production build: NOT VERIFIED.

## Evidence-backed implementation issues

1. **Titlebar location:** `apps/gemini-ui/src/components/shell/KNOuXShellComponents.tsx` contains `KNOuXTitleBar` at line 227, **not** a standalone `KNOuXTitleBar.tsx`. `KNOuXSidebar` begins at line 122.
2. **Titlebar min/max/close icons are inert in browser preview:** markup in the same file around lines 309-325 has buttons but no `onClick` handlers. Browser simulation must not claim native window management; Electron-only controls should be capability-gated or delegated through a typed allowed preload API. Avoid adding renderer Node/PowerShell.
3. **Global search needs accurate control behavior:** Titlebar search input at around line 260 invokes optional `onSearchChange` and displays Ctrl+K badge; validate that global shortcuts, filtering/command palette and search actually work. Treat optional handler with no provider as visibly unavailable or route to real command palette.
4. **Sidebar has fourteen navigation entries:** `CANONICAL_SECTIONS` in same file around line 94. Verify each button changes global state and active indicator; current `App.tsx` selects a whole page (each page renders its own shell), so do not add another nested sidebar/titlebar.
5. **Visual scale:** shared header uses `h-10`, sidebar `w-56`; several titles and metadata are 10-11px in current source. Compare actual 1366x768, 1672x941 and 1920x1080 screenshots, then refine typography and layout without hardcoding an incorrect global scale.
6. **Vite Fast Refresh warnings visible in Antigravity:** source modules mix React component exports and non-component exports. `NavigationContext.tsx` exports `SECTIONS_DIRECTORY`, `tryNormalizeSection`, `normalizeSection` alongside `NavigationProvider`; `KNOuXShellComponents.tsx` exports `CANONICAL_SECTIONS` alongside components; `studio/parts.tsx` exports `renderCategoryIcon` alongside components. Fast Refresh incompatible-export warnings are not proof the app is broken, but may trigger full reload and lose transient state while iterating. Safely separate pure helpers/constants into appropriate modules if warranted, with updated imports and tests; do not rename/remove exports blindly.
7. **Truthful UI state:** sidebar footer displays `System Guard Active` unconditionally; current Vite app is not proven connected to Windows service guards. Don't show verified native health unless sourced from a real native provider, or label development fixture.
8. **Security follow-up:** Current `App.tsx` still writes user-supplied API keys to `localStorage` inside `handleSaveApiKey`. Do not claim secure credential storage merely because the modal was changed. Must move secrets out of renderer in the platform stage, with consent and migration.
9. **Screenshots from previous read-only visual audit:** Home lacks approved cinematic Earth composition; System has large blank-height panels; Startup overlay obscures table/actions; Services lower Operation Preview is clipped. Use actual reference captures for fixes, not arbitrary restyling.

## Safe implementation order for active Antigravity agent

- Before any edits, recheck HEAD and dirty files, identify live concurrent agents/editors, and preserve work. This audit deliberately does not edit app source.
- FIRST: stabilize shared nav, titlebar, search behavior and viewport containment, and repair HMR warnings only with small focused refactors.
- SECOND: Home and System/Startup/Services highest-impact visual bugs; capture before/after at three viewports, no fake native statuses.
- THIRD: validate all other section visuals and accessibility, run TypeScript/build/safe screenshots.
- Commit and push only after owning file changes and verifying tests. Do not merge into main, reset, clean, create worktree per section or touch K: legacy work.
- Report exact commands, capture paths, SHA and unresolved issues without fake PASS.

**Do not interpret this audit as an instruction to stop current agent or duplicate its edits.**
