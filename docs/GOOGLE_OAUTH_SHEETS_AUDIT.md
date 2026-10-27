# KNOuX Google OAuth + read-only Sheets audit

Date: 2026-10-27
Branch: `feat/gemini-missions`
Owner handoff: Windows desktop OAuth client at a private path outside the repository; no consent or token existed when this increment started.

## 1. Delivered

- Main-process `GoogleOAuthService` in `apps/gemini-ui/electron/native/google-auth.cjs`.
  - Reads the installed/desktop client only from `KNOUX_GOOGLE_OAUTH_CLIENT_PATH` or a private `userData/oauth` path. The file is size-bounded, type-checked, loopback-redirect-checked and never logged, bundled or committed.
  - Authorization Code + PKCE S256 with a 64-byte random verifier and 32-byte random state.
  - Loopback HTTP listener bound strictly to `127.0.0.1:0`; exact `/oauth2callback` path; constant-time state check; error/denied/missing-code handling; 5-minute timeout; cancellation closes the listener.
  - `shell.openExternal` runs only after the explicit `google.connect` IPC, and only for the documented Google HTTPS authorization endpoint.
  - Code exchange, refresh and userinfo calls run only in the main process with bounded timeouts and redacted errors.
  - Refresh token and minimized account display name/email are stored as a safeStorage-encrypted blob (`google-refresh.bin`). Electron safeStorage is DPAPI-backed on Windows. No access/refresh token crosses the renderer bridge.
  - Read-only Sheets metadata/values are bounded (10 selected spreadsheets, 2000 rows, 60 columns, 2 MB response cap, validated IDs/ranges). Only user-added spreadsheet IDs are readable.
  - Disconnect deletes the local encrypted grant and attempts Google revocation; local deletion succeeds offline.
- Contract and bridge: eight fixed `knoux:google:v1:*` channels, narrow named methods, no generic invoke, no renderer URL/path. See `shared/native-contract.json` and `electron/preload.cjs`.
- Renderer: `useGoogleWorkspace`, `google-native.ts`, and the preserved hub design. Sheets has real Not connected / Connecting / Connected / Permission missing / Error states, fixed four-scope review, add-by-URL/ID, explicit metadata refresh, explicit read, disconnect, revocation instructions and a 7-day external-Testing warning. The other nine Google services remain labeled fixture previews.
- The automated tests initiate no live Google request and read no spreadsheet. During one visible development smoke capture, an external account connection appeared in the disposable smoke profile (the window was interactive); no spreadsheet was selected or read, the profile and its encrypted grant were deleted by the smoke runner, and no token file remains. Input is now ignored during smoke capture and the smoke profile has its Google state reset before launch.

## 2. Offline verification

`npm run test:google` (14 checks) covers:

1. PKCE verifier/challenge shape.
2. Spreadsheet URL/ID and A1 range validation, arbitrary host/character rejection.
3. Missing client configuration with no network request.
4. Malformed client JSON failing closed.
5. State mismatch aborting before token exchange.
6. Loopback timeout closing the listener.
7. Full local authorization-code round trip against a disposable mock token/userinfo/Sheets server.
8. Encrypted refresh-token storage with no plaintext token.
9. Selected-sheet metadata listing.
10. Bounded values read with no token fields.
11. Unselected spreadsheet read rejection.
12. Stale refresh token clearing local credentials and requiring reauthorization.
13. Best-effort revoke + local credential removal.
14. Network failure sanitization and no token fields in preload/contract.

The mock server receives dummy values only; no Google endpoint, client file or account is contacted. The development smoke's Google status probe uses the local main-process state, not Google.

## 3. Runtime evidence

- `test:native` includes Google channel/preload/handler and scope assertions.
- `npm run test:google` PASS.
- Development/packaged smoke adds `googleOk`: bridge present, status envelope `google.oauth.v1`, connected false, account null, DPAPI storage available, no token/client-secret field in the status payload. The Google hub and modal are exercised without pressing Connect.
- Screenshots: workspace-measured and workspace-oauth (disconnected real state) in dev/packaged evidence.

## 4. Not performed — explicit owner approval required

The following remain deliberately unexecuted:

- Opening the real Google consent page.
- Signing in or granting scopes.
- Receiving or storing a real refresh token.
- Reading a real spreadsheet through the Sheets API.
- Revoking a real Google grant.

The handoff requires a separate explicit owner approval before any live browser authorization or Google data read. No fake connected state, fixture sheet or fabricated token is used as closure.

When approved, the live verification sequence is:

1. Start the packaged app with `KNOUX_GOOGLE_OAUTH_CLIENT_PATH` pointing at the private client file.
2. Connect Google; confirm the browser shows exactly the four reviewed scopes.
3. Return to KNOuX; confirm Connected with a minimized account label and `windows-dpapi-safeStorage`.
4. Add a spreadsheet URL, refresh metadata, read a bounded A1 range, and capture redacted evidence.
5. Disconnect and confirm the local credential file is gone; optionally verify revocation at myaccount.google.com/permissions.
6. Inspect logs/screenshots/Git for token or client-secret leakage (must be none). A prior visible smoke window was interactive; the PII-bearing workspace screenshots from that run were deleted and are not committed. Final evidence must be recaptured in a disconnected state with input ignored.

## 5. Limits

- No Drive scope, so there is no general "list all spreadsheets" search; only selected IDs are read.
- Google external Testing refresh tokens can expire after 7 days with non-basic scopes; reconnect is required.
- The client `client_secret` is public-installed-app material; PKCE is used, and the secret is never treated as a server-side secret.
- No Google write, Gmail, Tasks, Forms, Contacts, Calendar, Picker, Slides, Chat or Classroom provider is implemented; those remain fixture previews.
