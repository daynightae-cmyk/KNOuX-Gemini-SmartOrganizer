# KNOuX circular logo / daylight asset

## Approved source (local, installed and verified)
`references/brand/00_knoux-circular-logo-day.png`
- 1254x1254 PNG with TRANSPARENT square canvas outside a visually circular mark.
- SHA256 `c02c3ba9e83f297dd86eba38a1ee2929685d3a105d9a9a63e726933d100d0feb`.
- The emblem depicts an iridescent lilac/blue circular orb with the original intertwined purple KNOuX symbol and KNOuX SmartOrganizer wordmark.

## How to use
Use the actual full-resolution image (or a proportionally downscaled derivative) in KNOuX app UI. Its visual boundary must be round with **NO square backing or rounded rectangle frame**. Preserve transparent alpha outside the circle. Keep clear padding around the circular silhouette. Do not make another made-up logo. Inspect light/dark contrast; on night mode add restrained glow/contrast in CSS without changing silhouette.

Current task: integrate first with the **Home** page; preserve other unrelated brand assets unless needed for a verified shared-shell fix. This is an ASSET integration, not an independent new fake dashboard.

Only use supported asset loading and ensure bundler packaging resolves the file from the worktree. Avoid hotlinking into the mission directory in a release build — if bundler requires, copy source PNG non-destructively into the appropriate app asset directory and commit that copy on the visual branch.
