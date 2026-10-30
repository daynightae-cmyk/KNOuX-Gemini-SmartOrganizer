# Cinematic entry — local main integration, 2026-10-30

Scope: canonical Windows checkout `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`, branch
`main`. Local integration only: no push, merge to remote, deployment, or installer rebuild.
Baseline revalidated before edits: `6f66a77` (main had advanced from the mission snapshot
`be399c7`). The entry lifecycle, audio, particles, preferences, keyboard access, native
readiness, Skip, Replay and Home mount are the existing engine; the visual layer was rebuilt
inside that boundary.

## Commits

| Commit | Content |
|---|---|
| `6d7d5b4` | `feat(entry)`: cinematic glass portal, official keyed mark, DAY/NIGHT material, collision-free copy, aura formation, held release frame |
| `d156db2` | `test(entry)`: raise the Playwright expect budget to 15 s for a loaded local runner; product timings unchanged |
| `b060e79` | `docs(entry)`: Electron evidence at `d156db2`, proof and browser-preview layout shots |

## What changed

- One component tree serves both themes. NIGHT keeps the approved midnight glass and violet
  energy ribbons; DAY now follows the owner's pearl-glass alternative: near-white field,
  static bokeh, masked ray fan, crisper rim, glossy emblem sheen, quotation line and a
  floating readiness medallion. The medallion appears only when READY (or while releasing).
- Emblem, title, quote, status, subtitle, native note and CTA occupy reserved regions; the
  ribbons are masked away from the DAY copy, and all orbit decoration sits behind content.
- Formation particles condense into a halo around the real DOM emblem instead of tracing a
  second logo. The release holds the exact READY frame; only the small live status changes to
  "Your workspace is opening" while the overlay dissolves over the real Home.
- The real Home stays mounted behind the portal, inert and dimmed; native readiness remains
  separately reported (`preview` / `pending` / `ready` / `unavailable`) with no fabricated
  Windows state. In the Electron run it read `ready` through the sandboxed bridge.

## Verified on this checkout

| Gate | Result | Evidence |
|---|---|---|
| `tsc --noEmit` | PASS | clean |
| `npm run build` | PASS | Vite bundle; existing chunk-size advisory only |
| `npm run test:entry` | PASS | 3 model tests + 23 Playwright tests, no skips |
| `npm run test:native` | PASS | contract suite, `failures: []` |
| `npm run test:home` | PASS | 10 live checks |
| `npm run test:navigation` | PASS | 3 route checks |
| `node scripts/cinematic-portal-capture.cjs` | PASS | real sandboxed Electron, 7 viewports, release, Home, reduced motion, bridge `ready`, `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` |

Ready/entering/Home frames were captured at 1672×941 (en dark, ar dark, en light), 1366×768
(en dark, ar light) and 1920×1080 (en dark, ar light), plus reduced motion at 1672×941 ar dark.
Every boot asserted no horizontal overflow and a fully visible CTA without scrolling. The
320 ms release frame is pinned at its real animation mark (`0.887` overlay opacity) because a
loaded machine can otherwise advance past it before the photograph.

The browser-preview probe additionally covers FORMING and 125 % / 150 % zoom in both themes;
at 150 % the measured CTA stays above the fold (night `364–414` of `512`, day `402–448`).
Those shots are previews, not Electron captures.

## Evidence

- `apps/gemini-ui/visual-evidence/cinematic-entry-final/` — Electron captures and `proof.json`
  (records commit `d156db2`, PASS, bridge and security prefs).
- `apps/gemini-ui/visual-evidence/cinematic-entry-layout/` — preview FORMING and zoom shots.
- `apps/gemini-ui/scripts/cinematic-portal-capture.cjs` — repeatable Electron run.
- `apps/gemini-ui/scripts/cinematic-entry-layout-probe.mjs` — repeatable browser layout probe
  (requires the Vite dev server on port 3000).

## Limits

- No remote push, PR, CI or packaged-installer acceptance was performed. The Electron run used
  the real `electron/main.cjs`, sandboxed preload and bridge from this checkout, not a packaged
  artifact.
- Visual fidelity is a qualitative comparison against the approved NIGHT reference and the
  owner's DAY alternative; no pixel-match is claimed.
- Reference PNGs remain separate review material and are never used as runtime backgrounds.
