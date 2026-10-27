# KNOuX Live Preview Design Language
Slogan: المستخدم يرى النطاق، ثم يرى ما يحدث، ثم يملك القرار، ثم يرى الدليل.
## UI shell anatomy
1. Section Hero with contextual measurement, status mode and honest permissions.
2. Orbit / instrument according to approved section design. Home command deck instead of forced wheel.
3. Center LIVE STAGE: unique visualization per service from service_specs, live native event data.
4. Right INSPECTOR with selection, risk, before/after, source timestamps, detailed receipts.
5. Bottom ACTION DOCK with Choose, Start, Pause/Cancel, Preview Changes, Confirm, Retry, Undo when safe.
6. Internal bounded table/list scrolling; no outer page vertical scrolling just to reach actions.
7. Playback control of animation means UI motion, never simulation of an OS effect.
## Component contracts
LiveServiceStage: serviceId, sourceMode, scope, eventStream, error, selected.
SourcePicker: grant/revoke scoped permissions, file IDs, volume/service/app IDs or OAuth resource IDs.
LiveTimeline: chronological real events, phase, processed, total optional, cancel, elapsed.
BeforeAfterLens: exact source→target and immutable plan hashes; compare pre/post status.
RiskConfirmation: irreversible flag, affected count, protected resource, typed permit.
ResultReceipt: success/partial/fail, per-item outcomes, source and target, reversible flag.
OrbitParticleField: glowing microdots and orbital rings follow active phase; disabled by prefers-reduced-motion, paused when hidden.
WorkbenchHost: SIDE / EXPANDED, keyboard focus, persistent filters, pin/unpin.
## Truth badges
LIVE WINDOWS, CONNECTED API, FIXTURE TEST, DESIGN PREVIEW, PERMISSION REQUIRED, PROVIDER UNAVAILABLE. No confusing fixture with owner data.
## Responsive & accessibility
1366x768, 1672x941, 1920x1080; 125%-150% scaling, EN/AR RTL, 14px normal text preferred. Keyboard/ARIA events, visible loading/error, high contrast DAY/NIGHT. Large lists virtualized; CPU timers cleaned up.
