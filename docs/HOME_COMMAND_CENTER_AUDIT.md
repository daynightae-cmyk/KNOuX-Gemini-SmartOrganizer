# KNOuX Mission 01 — Home Command Center Audit

Date: 2026-10-27
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Starting HEAD: `099500e204dbf9184e929f267fe0112f272ff725`

## 1. Status

**PARTIAL / MEASURED LIVE DASHBOARD, not final product acceptance.** Home now
reads existing versioned bridges and journals, shows explicit “not measured”
states when a bridge has no data, and never invents KPI totals, paths, activity
or reclaimable amounts. Service cards navigate to their real owner service;
execution remains in those services and is not performed from Home. Global
indexed file/application search is not implemented; the command palette is an
honest workspace/tool jump.

## 2. Source changes

| Layer | File | Role |
|---|---|---|
| Live hook | `src/home/live.ts` | Reads system/services summaries, Files sources + recent rows, scan history, apps inventory, automation workflows/journal; no heavy scan is auto-started; errors and provenance are retained |
| Derivation | `src/home/derive.ts` | Real KPI/activity/quick-access/volume/insight/pending-action models, byte/time formatting and explicit “not measured” states |
| Page | `src/pages/HomePage.tsx` | Wires live data; real titlebar palette filter; notifications from real activity; honest search labels |
| KPI hero | `src/components/home/HomeCommandCenter.tsx` | Live status/refresh, six measured KPI cards, no decorative sparkline or fake trend |
| Dashboard | `src/components/home/HomeDashboardPanels.tsx` | Live system sample, real volumes, recent files, measured activity, insight, review-only pending actions, functional tabs and filters |
| Fixture removal | `src/lib/home-ui.ts` | Deleted `INITIAL_KPIS`, `INITIAL_INSIGHT`, `INITIAL_ACTIVITIES`, `INITIAL_QUICK_ACCESS`, `INITIAL_STORAGE_VOLUMES`, `INITIAL_SAFE_ACTIONS` |
| Test | `scripts/home-live-test.cjs` | 10 static checks against fake totals, fake paths, decorative trends and execution claims |

The former `LiveProcessInspector` simulator was already removed in the Settings
increment; Home never used it.

## 3. Real data mapping

| Home surface | Measured provider | Fallback |
|---|---|---|
| CPU load / Memory / system disk | `knouxShell.getSystemSummary` | `—` / “not measured” |
| Services running | `knouxShell.getServicesSummary` | `—` |
| Indexed files + bytes | Files `listSources` | “No authorized source” |
| Verified reclaimable | Scan `history` verified bytes/findings | “No verified scan” |
| Workflow drafts / dry-runs | Automation `workflows` + `journal` | `0` / “no dry-run” |
| Installed applications | Apps `inventory` KPI | “Not measured” |
| Storage snapshot | System summary volumes | “No measured volumes” |
| Quick access | Files query (first ready authorized source, limit 6) | empty state |
| Recent activity | Scan history + automation dry-run journal | empty state |
| Insight / pending review | Latest verified scan bytes/findings | explicit no-estimate state |

No Google account, external API, paid provider, elevation, registry, service,
startup or file mutation was performed. Home is read-only.

## 4. Runtime evidence

Development Electron (fresh profile; measured values vary):

- Live status: “Live measured data”.
- KPI sample: CPU/memory/disk from the native summary; Apps **148 installed**,
  Services **113 / 271 running** (155 stopped), Files **7 indexed / 1 source**,
  Automation **1 draft / 1 dry-run**, scan **2–3 findings, 0 B verified**.
- Volumes: measured C:, D:, K: with real free/used values.
- Recent files: real indexed fixture rows (`readme.md`, `table.csv`, `app.ts`,
  `notes.txt`, image), no `C:\Users\Alex` path.
- Recent activity: real scan completion and workflow dry-run entries.
- Insight/pending actions: explicit “No verified cleanup estimate yet” and no
  pending action because verified reclaimable bytes are 0.
- Card navigation: Smart Scan/Studio/etc. tiles navigate to the owning route;
  the Studio tile navigation was exercised by smoke and Home was restored.
- Viewports: 1672×941 dark, light, Arabic RTL light; 1366×768 (6 KPIs within
  width, no horizontal overflow); 1920×1080. Footer/sidebar telemetry remains
  visible; inner panel scrolling is used.
- `homeOk`, `homeLayoutOk`, `screenshotOk` PASS in both development and
  packaged `win-unpacked` smoke.
- `test:home` PASS; lint and build PASS; prior native suites and Settings/Workspace
  probes PASS.

## 5. Honest limits

- Home is a **command center**, not an executor. Smart Scan, Studio, Cleanup,
  Startup, Repair, Services and Applications actions remain in their domains
  with their own approval/execution gates.
- Global indexed file/application search is not connected; the command palette
  navigates workspaces/tools and is labelled accordingly.
- CPU/memory/disk values are current native samples, not a historical series.
  A single 100% CPU sample can occur under load and does not prove system health.
- Files query/recent rows require an authorized indexed source; otherwise the
  panel is empty.
- The pending review item is review-only; Home has no delete/execute path.
- Light/RTL screenshots pass on Home; all other routes are not re-claimed here.
- No Windows system restore, service control, file mutation, account connection
  or paid AI call was performed.

## 6. Release record

The live Home increment is committed on `feat/gemini-missions` at
`4948959a417c177af30dc7e459a29cc16b240fc4`. Gemini Platform CI run
`40394777969` is SUCCESS, including `test:home`, every prior native suite and
development + packaged smoke. `main` is fast-forwarded to the verified record.
Mission 01 remains PARTIAL for global indexed search and in-place execution;
no service action is claimed from Home.
