# KNOuX cinematic entry

An original procedural entry in `apps/gemini-ui/src/features/cinematic-entry/` wraps the existing application under its existing NavigationProvider. It does not render another dashboard, replace a route, add a native window, or change any provider/capability state.

## Timeline and readiness

`INIT → FORMING → READY → ENTERING → ACTIVE`; replay from ACTIVE returns to INIT. Formation takes 3.2 seconds; Skip/Escape can bypass it as soon as the real renderer has painted. Renderer readiness uses two animation frames after the real child tree commits. It does not wait for Windows operations, authentication, scans or optional downloads. The bridge status is separately obtained through the existing versioned `readBridgeStatus`: browser preview / connecting / connected / unavailable. At 4.5 seconds a pending handshake is labelled unavailable; late success can still update the label. “Workspace interface ready” describes the mounted renderer only.

On Enter a synchronous phase guard rejects repeated activation before any audio promise runs. The medallion compresses immediately, brightens and expands; magnetic motes release into outward spirals. The atmosphere and glass fade over 1.6 seconds over the already painted, unchanged real shell. Its opacity stays 1 throughout. The overlay is removed only after that overlap; inert/aria-hidden are then released and focus moves to the real main heading (or main). Replay from Settings preserves the same workspace DOM and returns focus to the replay control. Navigation is never reset.

## Graphics

Original CSS layered glass, radial highlights, three glossy ribbon capsules and a separate pearl form the medallion. Canvas2D uses deterministic golden-angle motes with curved elliptical trails. A subset converges on ribbon segments before the solid mark resolves. Device pixel ratio is capped at 1.5. At most 230 motes, reduced to 100 on <=4 logical cores; ambient mode uses 28. Target 60fps during entry, capped at 30fps on constrained devices and during ambience. This is a budget, not a claim about every GPU. Canvas absence leaves the CSS scene and controls operational; no WebGL, shaders or downloaded graphics are required.

Home retains the same canvas behind its actual shell. Only the Home outer background/main background become transparent within this scoped boundary; panels and controls keep their own backgrounds. No background runs on other workbenches. Ambient motes settle after 12 seconds, stop scheduling frames when hidden, and use a single frame under reduced motion. Resize and phase changes wake the renderer. Cleanup removes observers/listeners and cancels outstanding frames.

## Audio cue sheet

No audio begins on mount. Default is muted. Enable Sound is an explicit user gesture and attempts a short 880/1320 Hz shimmer. Enter, when sound is enabled, schedules a 45ms triangle tick, quiet 110 Hz bloom, A-major resolving tones (220/277.18/329.63/440 Hz) and a faint 1760 Hz overtone. Voices have short attack and exponential decay; total tail <1.4 seconds. The browser AudioContext may deny/resist resume; entry proceeds identically. There is deliberately no automatic pre-gesture riser. No sound is played continuously in Home.

Contexts close on mute, hidden tab, transition completion and unmount. A generation counter prevents a late resume from scheduling voices after disposal. Audio is synthesized locally; no media sample, network request, system volume operation or copyrighted soundtrack.

## Accessibility and preferences

EN/AR labels and direction follow NavigationContext; brand stays LTR. Intro is a labelled dialog with visible focus outlines, native buttons/checkboxes, Tab containment, Enter/Space activation and Escape skip. The unchanged titlebar remains visible above the scene. Workspace controls are inert until entry completes, including titlebar controls, so there is no startup click-through. The platform/system close shortcut remains available.

`knoux.cinematic.v1` stores only four booleans: seen, always, muted, reduced. Storage failure leaves session behavior usable and displays a note. First launch plays the intro; repeat launch enters directly unless Always Show Intro is selected. System reduced-motion overrides the local toggle and uses a 180ms dissolve without spinning/scaling motion. Forced colors removes decorative particles and supplies system-color controls. Settings exposes replay and preference access. `?cinematic=replay` is a documented diagnostic replay without deleting user preferences. No secret values or existing profile schema are changed.
