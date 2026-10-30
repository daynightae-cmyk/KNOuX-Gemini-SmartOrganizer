# Shared task 02 — One KNOuX Ctrl+K command palette

## Scope and preservation
Existing Home command palette and global header search are already present. Inspect both before editing. Implement ONE application-wide typed search action, no second competing overlay, no different header design.

## Data and interaction contract
- Sources: sections/routes, service tools, recent commands, local indexed files under consent, installed application identities and authorized settings. Group results by source with titles, sublabels, capability provenance and meaningful icons.
- Every provider returns typed query/response with source, timestamp, request ID and request status; abort stale requests, debounce bounded queries, no blocking filesystem walk from the renderer.
- Keyboard: Ctrl+K open/focus, Escape close, arrows move selection, Enter activate, Space only for explicit control buttons, Tab predictable, focus restoration. Arabic RTL preserves icon and focus readability; reduced motion is respected.
- States: idle, loading, partial, empty, offline, denied, timeout, error/retry; offer scoped source connection if missing, never fabricate matches.
- Recent commands: persist only minimal local nonsecret metadata; reflect real previous selections, not demo examples. Clear history action with confirmation.
- Commands requiring side effects never run on selection: route to owning domain and open exact immutable plan/consent view.
- Visually preserve Home-approved header width, Ctrl+K keycap, lavender/night-glass border, sidebar geometry and design language.

## Workbench integration
Typed callbacks carry route ID, workbench ID, selected item ID, source capability and optional query; every domain resolves its own allowed action. Keep public UI usable when only navigation data is available.

## Quality
Test rapid queries and race ordering, empty results, permission denial, slow provider, error retry, screen-reader labels, Tab/Enter, 1366/1672/1920 widths and 125/150% scaling. Compare DAY/NIGHT captures; no fake search performance claim.
