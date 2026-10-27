# KNOuX Design System / Reusable Component Contract / QA

## Visual direction
Authentic KNOuX signature: controlled violet/lavender luminescence, dimensional glass, restrained spectral bloom and animated orbit rings. Dark base #07091b approximately; layered indigo/purple surfaces, electric-violet focus, mint for measured-good status, amber for caution and red for destructive states. Adapt tokens to existing light/dark theme rather than hard-coding dark everywhere. Keep glow peripheral to text to retain readability. Use procedural effects only, no giant screenshot wallpaper.

## Typography and density
Body text must remain legible in real Windows at 100% scale; min 14px normal copy, metadata min 12px with good contrast, card titles ~15–18px, hero headings ~28–40px depending viewport. At 1366, respond by rearranging content instead of shrinking type. Use 8/12/16/24px spacing rhythm and strong icon/title/action hierarchy. Arabic paragraphs wrap naturally and RTL controls remain operable. No overflow hidden on necessary information or hardcoded line clamp that hides instructions.

## Structural primitives
- App shell reuses current providers/nav and cinematic entry; no duplicate navbar/dashboard.
- KNOuXOrbitalAction: section-specific label, start/stop, disabled/unsupported and explicit consent states; phase/progress from real bridge; keyboard and reduced-motion equivalents. Prefer CSS conic-gradient/SVG, Canvas2D for decorative motes only.
- KNOuXGlassPanel: variants summary/tool/inspector/risk, no unnecessary nested borders, content-first sizing.
- KNOuXServiceCard: readable icon + short title + useful 1–2 line explanation + real status + meaningful action, active/hover/focus/disabled/error.
- KNOuXWorkbenchDrawer: side inspector at wide sizes; drawer on narrow. Preserve existing interactive service workbench and data rendering.
- KNOuXOperationTimeline: pending/running/partial/success/fail/cancel from live provider events, with concise log and optional progress without invented percentages.

## Layout & metrics
Design for 1920×1080 and 1672×941 while respecting 1366×768 and resizable Electron windows; no horizontal scroll, offscreen primary controls, microscopic text or clipped panes. Loading/error/unsupported/permission-denied/empty states must be accessible and visually integrated. Animation limited to meaningful operation states, pause when hidden, disable under prefers-reduced-motion, no runaway timers or Canvas loop after unmount.

## Reference matching
For each reference produce comparison: expected reference, actual at same viewport, and annotated differences. Concept images are aspirational; do NOT hallucinate hardware info, file counts, completion phases or operational safety guarantees. Mark deliberate, product-correct divergences explicitly.

## QA
Run workspace verification in approved checkout; npm lint/build + current relevant native, capability, consent/workbench and UI Playwright suites; add regression tests for controls. Execute on Windows desktop dev and unsigned packaged app when available. Ensure action test invokes the actual supported provider path with the correct safety prompt rather than a toast or fake progress. Every screen must pass screenshot, function and accessibility QA before advancing.


## Mandatory day/night paired acceptance
Every task requires separate screenshots of both references' implementation states: day/light and night/dark at 1366×768, 1672×941, 1920×1080, AR/EN, plus 125% zoom and reduced-motion mode. Record real backend state vs. concept placeholder metrics. Day/light design inherits the cinematic intro's luminous lilac/white glass character and must be readable in sunlight; dark retains KNOuX signature deep-violet glow without tiny text. Prevent unbounded GPU animation: dynamic progress must be bound to actual native operation states.

## Preserve app lifecycle
Do not duplicate `NavigationProvider` or mount/unmount the real workspace during cinematic transitions. Keep continuous native IPC identity. Compare against existing current screen captures supplied by the owner as BEFORE evidence.
