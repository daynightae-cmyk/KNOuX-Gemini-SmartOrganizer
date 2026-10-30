# Shared task 05 — Premium visual QA and accessible shared orbital engine

## One engine, not fifteen wheels
KnouxOrbit.tsx and existing orbital CSS constitute the shared engine. Each screen supplies exactly six typed node IDs, screenshot-matched fixed positions, original icon artwork/colors, service label, selected state and safe callback. Splash is NOT a six-satellite dashboard; it is its own glass-sphere cinematic entry.

## Visual lock
Preserve user-approved Home/Organization/Files/Storage/System/etc screenshot geometry. NEVER change satellite icons, colors, top header, sidebar, KPI card hierarchy, original right inspectors, table density or primary CTA. Do not replace physical six-node layout with generic grid. No CSS flattened wheel image, fake invisible hotspots or altered KNOuX emblem.
Day/night use identical DOM, dimensions and positions; only palettes, surface material, rim light, legibility/shadows and bloom change.

## Motion architecture
- Independent SVG concentric glass rings, elliptical fine strokes, moving light sweep, star trail and tiny glow particles. Layer subtle cosmic movement behind content.
- No satellite orbital motion, no whole-wheel rotation, no spinning text or unreadable icons.
- Hover and keyboard focus: localized violet bloom, ring emphasis, connector glow; pressed state and selected workbench are real React state, not visual-only.
- Ambient animation never asserts scan started, repair completed, workflow success or system health.
- Limit compositing and effects for low-end Windows GPU; pause excessive decoration when hidden and support 60fps target without false performance guarantees.
- Reduced-motion disables continuous decorative motion but retains all interactive feedback.

## QA / evidence
At 1672x941 DAY/NIGHT compare overlay geometry and satellite center coordinates, text baseline, orb diameter, hero bounds and right inspector width; also 1366x768 and 1920x1080, 125/150% scaling.
Keyboard Tab/Enter/Space, Escape, focus order, AR RTL stable positions/readability, screen-reader node names and tooltips, high contrast, click targets and no clipped nodes.
Capture exact screenshot paths and any reference mismatch. Owner explicitly signs pixel visual acceptance, never inferred from a successful build.
