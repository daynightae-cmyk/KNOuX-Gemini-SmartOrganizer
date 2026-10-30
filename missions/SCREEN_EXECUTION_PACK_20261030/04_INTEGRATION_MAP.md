# Integration map — one real KNOuX application

| Layer | Canonical path | Responsibility |
| --- | --- | --- |
| Active route | apps/gemini-ui/src/App.tsx | Existing switch to all available domain pages |
| Navigation | apps/gemini-ui/src/context/NavigationContext.tsx | Single section and history state |
| AppShell | apps/gemini-ui/src/components/shell/KNOuXShellComponents.tsx | Shared header/sidebar and theme |
| Orbit | apps/gemini-ui/src/visual/KnouxOrbit.tsx | Single SVG engine, fixed 6 satellite configs |
| Contracts | apps/gemini-ui/shared/native-contract.json and native-contracts.ts | Exact typed capabilities |
| Preload | apps/gemini-ui/electron/preload.cjs | Context-isolated approved methods |
| Main | apps/gemini-ui/electron/main.cjs | Guarded sender and allowlisted source |
| Workbenches | apps/gemini-ui/src/system + automation + operations | Existing specialised domain controllers |

Cross-domain access is through typed IDs and explicit handoff, not independent copied providers.
Read: capability + read scope -> native result with time/source/unit/permission/freshness.
Write: source identity -> immutable digest plan -> conflicts/risk -> explicit consent -> supported executor -> verified postcondition + receipt + optional safely provable Undo.
Audio/visual effects cannot fake native progress or action completion.
Browser preview does not have Electron IPC and must show meaningful unavailable state rather than fabricated data.

Per-screen integration manifests record exact implementation targets; their status is NOT_AUDITED until real tests are performed.
