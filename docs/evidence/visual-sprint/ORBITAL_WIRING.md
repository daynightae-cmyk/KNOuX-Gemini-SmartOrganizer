# KNOuX Orbital Service Engine — wiring evidence

Branch: `feat/knoux-visual-day-night-sprint-20261027`
Screens covered: the ten primary workspaces of the day/night reference set.

Every wheel is rendered by one shared component tree
(`apps/gemini-ui/src/visual/OrbitalControl.tsx`) styled by one stylesheet
(`apps/gemini-ui/src/visual/orbital-engine.css`, loaded last in `App.tsx`).
Day is the canonical geometry; night only changes materials. No screen carries a
second bespoke orbit implementation.

Each satellite invokes an existing page handler. The engine owns no service
state: native consent, progress and measured results stay inside the service it
opens. Satellites that cannot be honoured (no native bridge, no snapshot, no
capability) render disabled with a screen-reader state label instead of
pretending to be available.

| Screen | Six satellites | Real target |
| --- | --- | --- |
| Organization Studio | Sources, Visual Library, Rules, Destinations, Plan Review, History | Studio stage machine; centre opens stage 6 |
| Files | Find, Images, Organize, Filters, Sources, Preview | search focus, category filter, Studio handoff, filter/preview panels |
| Smart Scan | Quick, Deep, Startup, System Health, Applications, Privacy | `quick_scan`, `deep_scan`, `startup_impact_check`, `system_health_pulse`, `app_health_review`, `privacy_trace_check`; all gated on `scan.capabilities` |
| Applications | Installed Apps, Publishers, Updates, Footprint, Startup Links, App Search | `app-inventory`, `app-publisher`, `app-updates`, `app-size`, `app-startup-impact`, `app-search` workbenches |
| Storage | Volumes, Treemap, Largest Folders, Large Files, File Types, Age Profile | the six real tabs of the space map |
| Cleanup | Temporary Files, Browser Cache, Diagnostic Logs, Recycle Bin, Windows Update, Unused Items | the six measured scan categories; `aria-pressed` reflects membership |
| Startup | Startup Items, Boot Impact, Delay, Tasks, Filter, History | `startup-overview`, `startup-impact`, `startup-delay`, `startup-tasks`, `startup-filter`, `startup-journal` |
| System | CPU, Memory, Disk, Network, Temperature, Stability | `hardware-cpu`, `hardware-memory`, `hardware-disks`, `network-connectivity`, `hardware-thermal`, `system-health-check`; disabled until a measured snapshot exists |
| Repair | SFC, DISM Scan, DISM Restore, Network, Restore Point, Repair Logs | `repair-files-verify`, `repair-component-scan`, `repair-component-restore`, `repair-dns-flush`, `repair-restore-point`, `repair-journal`; preview only, nothing executes |
| Services | Running, Stopped, Dependencies, Recovery, Events, Startup Type | `services-inventory`, `services-search`, `services-dependencies`, `services-diagnose`, `services-state-history`, `services-config` |

Centres: each wheel's core button runs the page's own primary action
(scan, refresh, measure or open the review surface). None of them fabricate a
result.

## Behaviour probed in the browser preview

- Cleanup: `Browser Cache` pressed `true → false` on click while `Temporary
  Files` stayed `true` — the toggle drives the real scan category set.
- Storage: `Treemap` pressed `false → true` — the satellite switches the real
  space-map tab.
- Applications: clicking `Publishers` mounted the workbench host (a service
  selector appeared with value `app-publisher`).
- Smart Scan: all six satellites report `disabled` when the native bridge is
  absent, with the state exposed to assistive tech.
- System: all six report `disabled` until a measured snapshot exists.
- Repair: five tools open their staged preview; `Repair Logs` stays disabled
  without a journal snapshot.
- Startup: six services open.

## Layout verification

`node scripts/visual-preview.mjs <section> [compact]` was run for all ten
screens plus Home, Google Workspace, Automation and Settings.

- 1672×941 and 1366×768, light and dark: no console errors, no horizontal
  overflow, no covered inputs.
- `clippedPanels` reports `SECTION` for Cleanup and Startup only. Investigated:
  `.cln-hero` and `.stp-hero` compute to `display: contents`, so they have no
  box of their own and the check sees every child "outside" them. The children
  render in the grid parent as intended; this is a measurement artifact of the
  probe, not clipped content.
- Re-captured after every CSS edit; screenshots live in
  `docs/evidence/visual-sprint/<section>/{light,dark}-{1672x941,1366x768}.png`.

## Known limitations

- Bar widths, percentages and counts are only drawn when a measured session
  exists. In the browser preview most cards therefore show `—` with an explicit
  "native measurement required" notice. This is deliberate.
- Repair's guided sequence is a preview checklist. No DISM, SFC, CHKDSK, restore
  point or DNS flush is executed from this screen.
- The wheels do not animate progress; they show `loading` only while the owning
  service reports a real operation in flight.
