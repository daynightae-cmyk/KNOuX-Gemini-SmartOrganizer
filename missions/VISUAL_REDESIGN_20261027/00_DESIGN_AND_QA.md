# Visual system and quality gates

## KNOuX style foundation
Beautiful but legible violet/lavender layered glass; restrained bloom and neon outlines; dark indigo base, mint for measured healthy, amber for risk, red for destructive. Adapt existing light theme rather than forcing dark palette. Use visual depth with meaningful whitespace.

## Components
Reusable KNOuXOrbitalAction: typed operation states with actual provider events, optional progress (not fabricated), start/cancel/review affordances; animate ring only while real operation is active. KNOuXServiceCard: icon, heading, one compact useful description, status, accessible action; no horizontal-stretched flat look. KNOuXInspector/Drawer: shows selected item and real workbench; fits windows. KNOuXOperationTimeline: pending/running/success/failure/cancelled. Preserve existing native IPC constraints.

## Readability
Normal body 14–16px, meta >=12px. Desktop hero display headings 28–40px responsive, cards 15–18px. Line-height >=1.4. Cards are allowed to grow. At 1366x768, reduce column count or use drawers, NEVER crush text.

## Visual QA
Same target viewport captures as reference (1672x941), plus 1366x768 and 1920x1080; EN+AR, dark+light; reduced motion, focus, contrast, no clipped controls. Capture before+after+annotated differences. Image diff gives feedback, not a guarantee of pixel perfect identity with generated art. User visual review decides.

## Functional QA
Primary action opens the actual workbench/scan/analysis, never inert toast or decorative-only. Watch native errors, cancellation and unsupported states. Never mutate personal files/registry/services or connect accounts during QA without separate explicit owner authorization. Only display real measured values.

## Tests
Use established build/lint/Windows smoke, UI and provider test suites; preserve existing snapshots and the cinematic intro. No merge/commit to main while Qoder is active. Document exact branch+SHA per page.
