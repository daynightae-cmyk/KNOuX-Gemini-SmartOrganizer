# Shared task 01 — Route activation + System / Automation bridge fidelity

**PRECONDITION:** Audit first. At 2026-10-29 inspection App.tsx ALREADY rendered SystemPage and AutomationPage, and native-contract.json / preload.cjs / main.cjs ALREADY contained systemSnapshot and automation.capabilities/start/status/cancel/snapshot/workflows/save/templates/dryRun/schedulePreview/validateImport/journal/report. Do not add duplicates based on an outdated task board.

## Investigation
1. Read current branch/HEAD/untracked evidence, navigation aliases, AppContent switch, page imports, page hooks, provider registration and preload exposure.
2. Trace each click from Sidebar and shared KnouxOrbit through NavigationContext to active AppSection and proper domain Page. Verify direct user interactions, route restoration, Back/Forward and selected workbench state.
3. In browser preview expect Electron preload absent; confirm explicit native-required banner, no invented metrics, no generic placeholder covering domain content.
4. In packaged Electron confirm trusted BrowserWindow, contextIsolation, preload API shape, promise behavior, sender guard and read-only provider initialization. Verify exact result envelope and real errors.
5. Compare available methods with native-contract.json IDs and native-contracts.ts; report absent or mismatched methods rather than creating a second bridge.
6. Fix only demonstrated source-to-result gaps, preserve existing visual scenes and user data.

## Native safety
- Each channel: strict registered capability ID, no arbitrary IPC suffix/dynamic command, exact number/types/length of arguments, trusted sender, sanitized errors, bounded response.
- Automation local drafts and dry-runs retain their functionality; these are not evidence of effectful Windows task execution.
- System metrics must include source + timestamp + unit, with explicit unknown for missing sensors; no synthetic time history or zero-for-unavailable.
- Native action/restart/cancel endpoints must not be bypassable by a generic shell executor.

## Test gates
- Route clicks reach correct specialized pages in DAY/NIGHT, EN/AR, keyboard.
- Browser-no-bridge is intentional and truthful; packaged Electron bridge has valid and invalid request tests.
- Duplicate IPC handlers absent. Signed source records not mistakenly labelled LIVE when fixture.
- TypeScript lint, build, native contract tests, packaged electron and owner reference comparison.
- Deliver route diagram, changed paths, native runtime evidence, and exact unresolved limitations; do not push or merge.
