# KNOuX Mission 14 — Settings & Assistant Audit

Date: 2026-10-26
Repository: `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`
Branch: `feat/gemini-missions`
Starting HEAD: `c53d107352f075b788b1723b5f0409a2f2546dde`

## 1. Status

**PARTIAL / BLOCKED, not final product acceptance.** The Settings page now has
real non-secret preference persistence, credential-free export/import preview,
a working reset, honest unsupported controls and no simulated telemetry. Native
secure credential storage, a native AI proxy, live assistant consent/allowlist,
full light-theme parity and the remaining per-tab product depth are **not
implemented**.

## 2. Observed gaps corrected

| Observed issue | Current behaviour |
|---|---|
| “Live Process Inspector” animated CPU/RAM/logs and claimed “Google Workspace Sync … 10 APIs Connected” | Component and usage deleted; footer now states preferences/secret/AI limits honestly |
| “Save All Settings” only showed a success toast | Real `saveSettingsProfile` persists a typed non-secret profile; success states exactly what was saved and what has no effect |
| Engine mode/toasts claimed performance changes | Controls are explicitly preferences only; no native engine provider; runtime performance unchanged |
| Guards defaulted on (auto-clean/privacy/registry sentinel) | No guard engine exists; all three are off and disabled with a NOT IMPLEMENTED notice |
| “Theme applied” toast without applying a theme | Accent/density are persisted page-local preferences with an explicit preview; global theming is not claimed |
| Export/reset buttons only showed toasts | Export writes a credential-free JSON profile; import previews a diff and applies only non-secret preferences; reset persists defaults |
| Backup tab implied Windows System Restore | Renamed and labelled: preferences only; Windows restore belongs to Mission 11 Repair |
| Google settings claimed “Authorized credentials and scopes active” | States no Google account/token exists and live authorization is unavailable |
| API key test could look like persistence/secure storage | Key remains page-memory only; the UI states no native vault/proxy exists and advises against long-lived keys |
| Smoke screenshots claimed 1366/1920 but could capture 1672 | Deterministic frameless `setBounds` resizing plus viewport assertions; dev and packaged evidence now measure the named sizes |

## 3. Delivered source

| Layer | File | Role |
|---|---|---|
| Profile model | `src/settings/profile.ts` | Typed non-secret profile, normalization/clamping, localStorage persistence, credential-free export, import preview/diff, reset |
| Settings page | `src/pages/SettingsPage.tsx` | Real Save Preferences, export/import/reset, honest engine/guard/Google/AI states, density and page-local accent preview, honest footer |
| Deleted simulator | `src/components/common/LiveProcessInspector.tsx` | Removed fake telemetry and false connected log lines |
| Test | `scripts/settings-consent-test.cjs` | 8 checks: no simulator, real save, credential-free export, import preview, session-only keys, disabled guards, honest Google/AI, no alert |
| Smoke | `electron/main.cjs`, `scripts/native-smoke.cjs` | 7-tab Settings probe, density persistence across route remount, guard disabled, save, export/import UI, RTL/1366/1920 screenshots |
| CI | `.github/workflows/gemini-platform.yml`, root/app `package.json` | `test:settings` gate |

## 4. Measured runtime evidence

- Development Electron: `settingsUiReady: true`; control probe `ok`, zero
  failures; 7 tabs; save persisted `density: compact` to
  `knoux_settings_profile_v1`; route unmount/remount restored compact density;
  guard switches disabled; no fake Google active claim.
- Layout: 1672×941 dark and Arabic RTL; 1366×768 `viewportWidth: 1366`,
  footer visible, 7 tabs, no horizontal overflow; 1920×1080. Light theme is
  **not supported** by this dark-only hub and is explicitly marked blocked.
- Packaged `win-unpacked`: same checks, `settingsOk`, `settingsLayoutOk`, 7 tabs,
  1366/1920 viewports, Arabic RTL, screenshots.
- `test:settings` PASS; `test:native`, `test:workspace` PASS; lint and build PASS.
- Screenshots: `settings-measured-dev{,-ar,-1366,-1920}.png` and packaged
  equivalents under `visual-evidence/platform-00/`.

## 5. Security and permissions

- No API key or token is written to localStorage; the profile has no credential
  fields and export sets `secretsExcluded: true` / `aiProvidersExcluded: true`.
- Keys remain page-memory only; closing the app discards them. The UI says so.
- No Google account, OAuth token, provider request, Windows setting, registry
  change, file operation or elevation occurred while testing.
- No direct `alert()` or fake save/apply success remains in Settings.
- The live assistant remains blocked: no native secure vault, no provider proxy,
  no operation allowlist and no explicit billing/network consent flow.

## 6. Honest remaining gaps

- Native OS secure credential storage (DPAPI/Electron safeStorage) and a native
  provider proxy that keeps secrets outside the renderer.
- Real AI assistant connection with typed tools, consent, allowlist, cancellation
  and cost/network warning. Session-only chat remains a limited preview.
- Engine performance controls are preferences only; no native engine executor.
- Registry/privacy/auto-clean guards are unsupported and disabled by default.
- Google Workspace remains disconnected pending explicit OAuth consent and the
  Mission 04 provider work.
- Full light theme and per-route light/RTL acceptance.
- Windows System Restore is not part of this page and was not executed.

## 7. Release record

The implementation is committed on `feat/gemini-missions`; exact SHA, CI run and
`main` integration are recorded in `missions/MISSION_SEQUENCE_PROGRESS.md` after
the release gates pass.
