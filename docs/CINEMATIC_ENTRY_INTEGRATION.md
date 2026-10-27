# Integration — cinematic entry

**DO NOT MERGE while Qoder is active in the canonical Windows checkout.**

Repository: `daynightae-cmyk/KNOuX-Gemini-SmartOrganizer`. Branch: `feat/smart-cinematic-entry-20261026`. Cloud-only baseline: `099500e204dbf9184e929f267fe0112f272ff725` from current origin/main on 2026-10-26. There was no pre-existing work in this new checkout. No Windows path, retired repository source, provider, IPC contract, security preference or service ledger was edited.

The explicit user request overrides AGENTS.md's older Windows-only path/branch restriction for this task. `python scripts/verify-workspace.py` correctly returns `KNOuX_CANONICAL_WORKSPACE_BLOCKED: WRONG WORKSPACE` on Linux; it has not been modified or presented as passing. Alternative checks verified HTTPS origin, clean baseline, exact main SHA, ancestry, dedicated branch and file scope.

## Small integration surface

- App.tsx: import CinematicEntry, wrap the single existing AppContent under the existing NavigationProvider.
- SettingsPage.tsx: import and render the replay button inside existing main content.
- src/features/cinematic-entry/: state/preferences, audio, particles, boundary and scoped styling.
- tests/entry/: deterministic model/audio tests, real-app browser interaction/visual tests and isolated unmount fixture.
- package.json/lock: Playwright test tooling and test:entry script only; existing versions retained.
- scripts/cinematic-native-smoke.cjs and .github/workflows/cinematic-entry.yml: browser plus real Windows/preload/unsigned-packaged acceptance. Existing native suites/workflow remain intact.
- These three docs and curated evidence. Heavy reference PNGs are not committed.

## Reproduce

Use the existing checkout; do not create another clone or worktree. With Node >=22.12 (cloud validated Node 24.19.0), from apps/gemini-ui:

```sh
npm ci
# On the managed cloud proxy, install the optional Electron binary explicitly:
NODE_USE_ENV_PROXY=1 electron_config_cache=/workspace/.cache/electron node node_modules/electron/install.js
npm run lint
npm run build
npm run test:native
npm run test:entry
npm run dev
```

Browser tests use /usr/bin/chromium when available, otherwise Playwright's installed Chromium. Override with PLAYWRIGHT_CHROMIUM_EXECUTABLE, or install using `npx playwright install --with-deps chromium`. Open the renderer using the product's supported workflow; onboarding has no public loopback preview. Native Windows behavior is unavailable in the Linux browser.

On Windows, run `node scripts/cinematic-native-smoke.cjs`, `npm run desktop:pack`, then `node scripts/cinematic-native-smoke.cjs --packaged`. These use a new temporary profile and deliberately click Enter against the real renderer; they verify versioned bridge readiness, contextIsolation/sandbox/nodeIntegration and unchanged main identity. They do not connect accounts or mutate Windows services/files. The existing legacy native-smoke script does not explicitly enter the new boundary; its screenshot flow should be reviewed before treating it as intro acceptance.

## Owner integration after Qoder is idle

1. Review this PR and Qoder's current changes; fetch both refs. Do not overwrite local work or auto-merge.
2. If Qoder advanced App.tsx or SettingsPage.tsx, manually preserve the current providers/router/shell and apply only the wrapper/import and replay button. Do not copy an old page implementation over Qoder's Home work.
3. Review package.json/lock changes with the current lockfile; retain the added test tooling and current upstream versions. Review background transparency selectors against any new Home shell structure.
4. Run all existing native/consent suites, entry tests, Windows development and packaged smoke. Check the exact PR SHA and 12 viewport/locale/theme combinations. Verify actual Home metrics against the current native implementation.
5. Owner approves and performs the integration only after concurrent work and required CI are resolved. No automatic merge is configured.

## Provenance

User-supplied CODEX_CLOUD_MISSION.md and KNOuX_Codex_Cinematic_Cloud_Kit.zip are task specifications/reference material, subordinate to the user's direct isolation and safety instructions. All ten separate PNG names and original SHA-256 digests are in evidence/cinematic-entry/reference-manifest.json. They were inspected as an ordered storyboard and remain temporary reference files. No authorized Forge source audio/components were found in this repository; the mark, glass, particles and sound are original procedural implementations inspired by the reference family, with no copied media or external CDN dependency.

The original creation baseline contained static Home preview values. Published main 66d8808 subsequently delivered the measured Home implementation. It was brought into the dedicated feature branch without modifying its Home/provider code; the only conflict was package.json, resolved by retaining test:home and test:entry. The intro now reveals that upstream Home, with truthful native-unavailable states in a browser. Native/consent capability states remain authoritative.

## Quality follow-up

CI installs from the frozen lock with `npm ci --ignore-scripts`; the Windows job then runs the pinned Electron package's checksum-verifying installer explicitly. Hosted Ubuntu CI uses its preinstalled Google Chrome (`/usr/bin/google-chrome`), while local acceptance continues to use system Chromium. No native or application security checks were disabled. The entry presentation is decomposed into small controls/copy/footer components and deterministic particle geometry/draw helpers; the real workspace mount boundary is unchanged.

## Published workbench update and final reliability repair

Published main 86cf321 was safely incorporated into the existing cloud feature branch. test:home, test:entry, test:workbench and all upstream scripts are retained. Settings changes additionally replace mouse-only choice cards with native buttons, use dataset for local styling preferences and extract pure tab render helpers; no native/AI/consent provider semantics were changed. The renderer public AppSection type export and live navigation remain intact. Decorative Canvas uses an inert accessibility wrapper and observes the same stable boundary. All rule checks remain enabled.
