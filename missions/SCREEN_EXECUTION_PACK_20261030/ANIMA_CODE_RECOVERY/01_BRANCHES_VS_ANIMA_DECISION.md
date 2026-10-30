# Engineering comparison — source branches vs Anima screenshots

## Preferred production foundation: CURRENT D: APPLICATION (main + preserved worktrees)
The canonical application already has a single Electron/Vite/React shell, source-controlled native Main/Preload allowlists, domain page routes, verified source modules and scripted native tests. Main HEAD 770396b with 9 local unpublished commits at inspection time.

## Anima captures
88 code-screenshot images, 86 unique. Code visible for providers, state hooks, core layouts and types; 2026-10-29 screenshot changelog describes planned/claimed work but it is NOT an authoritative runtime proof. Images contain no original ZIP source; only one tiny index.html could be reliably transcribed end to end.

## v0 != confirmed Anima
GitHub does include an accessible branch v0/knoux-smartorganizer-integration-b432675e at c01638d. Its tree is a canonical monorepo (apps/gemini-ui src and electron, root electron/studio). The FireShot screenshots instead appear to show a separate root src/ + electron/*.mjs React project. Therefore DO NOT identify the v0 branch as the Anima screenshot source without explicit proof.

## Relative assessment
- Windows native operations and security: CURRENT canonical project more trustworthy for deployment (existing Main/Preload/test evidence; outcome still subject to native proof).
- Visual inspiration and candidate React components: Anima screenshots potentially useful, but cannot judge functioning visual fidelity without running original export.
- maintainable source & branch traceability: CURRENT project wins; screenshots are non-editable evidence.
- complete features: status is UNKNOWN in Anima until exact export, native Windows tests and receipts.
- safest strategy: HYBRID — keep canonical main; stage genuine Anima exports; port only approved missing UI and source-backed features in scoped changes.

## Strict merge gate
1. Verify Anima original source export and its package/dependency lock.
2. Map screen/component imports to existing app shell, KnouxOrbit and domain provider contracts.
3. Inspect for arbitrary shell, unrestricted IPC, fake timers, fake provider states, unsafe mutation and secrets.
4. Test TypeScript/lint/build/unit/native/packaged Electron before any promotion.
5. Owner reviews pixel visual reference, DAY/NIGHT, orbit icon geometry, keyboard/RTL and the exact changed files.
6. Only then consider a scoped branch commit/PR; do not overwrite main or publish automatically.
