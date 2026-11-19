# Settings inner workspace

Settings is the local-preference workbench: engine and hardware preferences,
the Main-owned AI key, Google Workspace status, disabled guard switches, the
clipboard vault, appearance, language, and the credential-free profile backup.
It is a real surface with measured state, not a mock control panel.

## Sections and behaviour

| Section | Test id | What is real | What is deliberately not connected |
| --- | --- | --- | --- |
| Engine & Turbo Hardware | `settings-tab-engine` | typed engine/RAM/CPU preferences persisted locally | no engine provider; the notice says scan speed does not change |
| AI Copilot & OpenRouter Keys | `settings-tab-ai_keys` | Main-owned provider bridge, measured bridge state, verify/clear, optional encrypted persistence | no live provider call without an owner key |
| Google Workspace Hub | `settings-tab-workspace` | disconnected status; OAuth entry point | no account or token in this checkout |
| Automated Protection & Guards | `settings-tab-guard` | explicit not-implemented notice, controls disabled | no guard engine |
| Clipboard Vault | `settings-tab-clipboard` | opt-in session vault with isolated native tests | — |
| Neon Glass Customization | `settings-tab-appearance` | persisted accent/density, page-local preview | global app accent is not connected |
| Language & Locale | `settings-tab-language` | live EN/AR direction and locale switch | full route-by-route light parity is tracked separately |
| Profile Preferences Backup | `settings-tab-backup` | native export/import, diff preview, reset and undo | Windows restore belongs to Mission 11 Repair |

The eight sections are one `role="tablist"` with a roving tabindex, one
`role="tabpanel"` labelled by the active tab, `Home`/`End`, and RTL-aware
`ArrowLeft`/`ArrowRight`. The cinematic intro strip is page-level chrome above
the panel, so it is not announced as tab content. The toast is a `role="status"`
live region; the password visibility button uses a logical `end-3` inset.

## Native profile files v1

The hardened shell cancels every `will-download` event, so an anchor + blob
export is a no-op in Electron. `electron/native/settings-profile.cjs` is the
only export/import path:

- `knoux:settings:v1:export` takes exactly one request key, `profile`. Main
  validates all seven typed fields, opens the real save dialog, writes an atomic
  temp file and renames it, forces the `.json` extension, and returns only
  `{ canceled, fileName, bytes, writtenAt }`.
- `knoux:settings:v1:import` accepts no argument. Main opens the real open
  dialog, reads at most 64 KiB, requires
  `knoux.settings.profile.v1` or `knoux.settings.export.v1`, rejects unknown
  fields, and refuses any credential-like key anywhere in the document.
- The exported document contains `secretsExcluded: true`,
  `aiProvidersExcluded: true`, the seven-field profile and a fixed notice. There
  is no API key, token, cookie, password or provider field to export.
- The renderer never names a path and never supplies raw JSON. The preload
  rebuilds a fixed seven-field object; extra keys are dropped before IPC, and
  Main refuses unexpected keys again on its side.
- Sender validation runs before any dialog or filesystem access. A dialog or
  filesystem exception is wrapped into a fixed code and a bounded message; the
  chosen path is never echoed over IPC.
- The browser preview keeps the anchor download and file-input fallback and
  labels the button `data-export-mode="download"`; Electron labels it `native`.

The capability has two user-initiated channels and no read-only or generic file
access. There is no `write`, `read-directory`, `delete` or caller-selected path
capability in the contract.

## Verification

```powershell
cd apps/gemini-ui
npm run test:settings         # honesty, credential boundary, no fake telemetry (8 checks)
npm run test:settings-profile # native module, IPC, filesystem, refusals (13 checks)
npm run test:native           # contract mirror, preload, main, capabilities
npm run evidence:settings     # real Electron: 11 probes + 9 screenshots
```

`scripts/settings-inner-evidence.mjs` drives the real Main + preload + renderer
against `dist/`. It stubs only `dialog.showSaveDialog` / `showOpenDialog` (an
automated run cannot click a desktop dialog); Main still reads and writes real
disposable fixtures outside the evidence directory. Probes cover composition and
ARIA, LTR/RTL keyboard order, persistence across reload, native export file
contents, import diff plus apply, secret-bearing import refusal, AI/engine
honesty, path-smuggling refusal, four bilingual Day/Night frames, and the
browser-preview fallback.

Evidence lives in
`docs/evidence/inner-workspaces-20261103/settings-inner-workspace`:
`proof.json`, `layout-frames.json`, `native-export.json`, `import-applied.json`
and the desktop/browser screenshots. The last verified run is 11/11 probes,
0 page errors, with the known `frame-ancestors` meta-CSP console notice only.

## Boundaries

- No Windows restore point, OS restore, registry change, engine execution or
  automatic guard is created here.
- No credential is stored in `localStorage`, the settings profile or an export.
  The AI key remains Main-owned and is persisted only with explicit opt-in and
  an available DPAPI-backed `safeStorage`.
- Deleting or overwriting an arbitrary user file is not possible through this
  capability: the owner picks the destination, the dialog confirms overwrite,
  and the document is rebuilt by Main.
