# Final owner actions

Everything in this file is an **external dependency the owner must supply or
approve**. None of it is a code defect, and none of it blocks the application
from running, browsing, measuring, or configuring local preferences. Each item
turns an honest "not connected / needs credential" state into a live one.

No value below belongs in git. Supply credentials only through the app or a
private path on the owner's machine, never in a commit, screenshot or issue.

## 1. Google Workspace live authorization (D04 + D14.03)

The OAuth implementation, PKCE loopback flow, encrypted token storage, scope
table and consent UI are complete and tested. Live reads are blocked only by the
missing owner client.

| Step | What the owner does |
| --- | --- |
| 1 | Create (or reuse) a Google Cloud project and enable the Sheets API. |
| 2 | Create an OAuth client of type **Desktop app**. |
| 3 | Save the downloaded client JSON to the app's private userData path `oauth/google-desktop-client.json`, or point `KNOUX_GOOGLE_OAUTH_CLIENT_PATH` at it. |
| 4 | Open **Settings → Google Workspace Hub**, press Connect, and complete consent in the browser window. |

The client file is never read from the repository, is excluded from packaging,
and is validated for the installed-app type, the documented Google endpoints and
a loopback redirect before any network call. The refresh token is stored only as
a DPAPI-encrypted blob; it is never returned to the renderer.

After consent, the affected matrix rows can move from
`BLOCKED_REQUIRES_USER_ACTION` to a measured live state. Until then the product
must keep reporting disconnected.

## 2. AI provider live verification (D14.02 / D14.08)

The Main-process bridge, fixed destination allowlist, redaction, cancellation
and optional DPAPI persistence are complete and tested against an injected
transport. No live provider call has been made.

| Step | What the owner does |
| --- | --- |
| 1 | Open **Settings → AI Copilot & OpenRouter Keys**. |
| 2 | Choose a provider and hand it a key with **Hand to Engine**. |
| 3 | Press **Test Connection**; optionally enable encrypted persistence. |

The key never enters renderer storage or the settings profile, and the export
path refuses credential-like fields. A live verification moves the two AI rows
from "requires an owner key" to measured. Without a key, the app must keep
showing `READY · NO KEY` and the assistant must keep refusing to invent output.

## 3. Windows write-class verification host

Read-only measurement, inspection and planning run on any Windows account.
Services that would change the machine — startup entries, service state, cleanup
quarantine/deletion, repair actions — require an elevated disposable Windows test
host and explicit owner approval per action. They are not exercised on the
owner's daily machine.

## 4. Release signing

`electron-builder.config.cjs` deliberately produces an **unsigned** platform
proof build (`signAndEditExecutable: false`). Public distribution requires a
Windows code-signing certificate and a signing decision; until then no artifact
may be described as a signed release.

## Status

| Item | State | Unblocks |
| --- | --- | --- |
| Google OAuth desktop client + consent | waiting on owner | D04 live reads, D14.03 |
| AI provider key | waiting on owner | live AI verify/completion (D14.02, D14.08) |
| Elevated Windows test host | waiting on owner | write-class Windows services |
| Code-signing certificate | waiting on owner | signed distribution |
