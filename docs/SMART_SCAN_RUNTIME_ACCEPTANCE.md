# Native activation runtime checkpoint — 2026-11-02

**PARTIALLY VERIFIED**. This is one recovery slice, not a release or completion of the Ultimate mission.

## Live preview first

Starting canonical main: `5d27ec1410b94db2d3ce78ce22ac964e91b3891e`, clean tree, workspace guard passed, fetched origin/main equal. Existing scripts: `npm run dev` → `http://127.0.0.1:3000/`; `npm run desktop:dev --prefix apps/gemini-ui` → canonical Electron main, sandboxed preload and real renderer. HTTP 200 and `/@vite/client` verified. Initial Electron PID 14356/renderer 16732; Vite PID 8540. PIDs are observations, not permanent identifiers.

Initial actual Electron screenshots: `docs/evidence/native-activation-20261102/{home-initial,smart-scan-initial}.png`. The Windows screenshot helper failed; screenshots came from actual Electron CDP, not a browser substitute. Vite remained the same server; renderer changes used HMR, while native updates required controlled Electron relaunch.

The first Electron process exited code 1 without a terminal stack. Some CDP screenshots timed out at the compositor. These failures are not counted as visual passes. Subsequent `node apps/gemini-ui/scripts/live-preview-check.cjs --no-screenshots` reused port 9333 and verified Home/Smart Scan × dark/light × EN/AR at actual 1672×941: correct language/direction/theme, native API and HMR present, no page/horizontal overflow, renderer errors or failed requests. `preview-verification.json` explicitly uses `filename: null` for these eight DOM/runtime records.

Baseline React duplicate key `.1` was traced to `CommandCanvas` merging children from different wrappers. Parent-qualified keys preserve identities; the final eight-state run reported no console errors. The development CSP warning is recorded in preflight; packaged CSP was not weakened. Static/build checks do not certify packaged runtime.

## Clipboard vertical slice

Entry: **Settings → Clipboard Vault**. Eight fixed typed channels in `shared/native-contract.json` are mirrored by preload. Every handler validates the trusted top-level sender. Capture/copy/remove/clear need native confirmation; capture is off after every start. Status/list do not read the system clipboard. No raw clipboard, Node or generic IPC API is exposed.

| Command / gate | Actual result | Limit / evidence |
|---|---|---|
| `npm run test:clipboard` | PASS | 16 grouped checks; injected clipboard/disposable files; `local-checks.txt` |
| `npm run lint` | PASS | TypeScript; `local-checks.txt` |
| `npm run build` | PASS | `local-checks.txt`; bundle-size warning remains |
| `npm run test:native` | PASS | Existing isolation/CSP/contracts plus clipboard mirror |
| `npm run test:scan` | PASS | Existing 10-service coordinator fixtures |
| `node apps/gemini-ui/scripts/studio-attribute-reader-test.cjs` | PASS locally | Real Win32 attributes and fail-closed negative cases |
| `npm run test:studio` | PASS locally | Source/index/preview fixture; no owner-data mutation |
| `npm run test:home` | PASS | Existing measured Home checks |
| `npm run test:settings` | PASS | Existing settings checks |
| `npm run test:workbench` | PASS | Existing workbench checks |
| `node apps/gemini-ui/scripts/clipboard-electron-test.cjs --screenshots` | PASS | Actual Electron/preload/IPC, real Windows safeStorage, **injected test clipboard only**; `clipboard-electron.json` + 4 fixture captures |
| Personal clipboard capture/copy | UNVERIFIED | No owner clipboard read/write or automated consent |
| Explorer file-drop compatibility | UNVERIFIED | File references copy back as text; parsers do not certify source application formats |
| Packaged/installed clipboard effects | UNVERIFIED | Development harness is not installed-app proof |
| Owner visual acceptance | UNVERIFIED | New vault screenshots are review evidence, not owner approval |

The real Electron harness exercises cancellation reaching visible UI, capture/list/inspect/pin/copy-back through sandboxed preload, zero reads while paused, encrypted history restoration with capture off, and AR/EN/theme direction with no horizontal overflow. Its actual content viewport is 1656×876 (1672×941 outer window), recorded accurately. Encryption restoration here recreates the vault in-process; it is not a claim of full installed process-restart certification.

## Security / persistence

Entire state (including previews/metadata) is encrypted. Unavailable secure storage falls back to memory without plaintext disk writes. Failed atomic rename retains prior ciphertext and reports pending state. Corrupt/undecryptable stores stay locked until separately confirmed discard. Pins remain within count/byte bounds; retention is applied at init/access/capture. Opt-out invalidates an in-flight read. Shutdown waits at most five seconds for queued writes; forced interruption retains the prior atomic store.

Reviewed [pinned Electron clipboard documentation](https://github.com/electron/electron/blob/v43.4.1/docs/api/clipboard.md), its [native implementation](https://github.com/electron/electron/blob/v43.4.1/shell/common/api/electron_api_clipboard.cc), and [safeStorage documentation](https://www.electronjs.org/docs/latest/api/safe-storage/). Raw custom formats do not prove Explorer support. Windows encryption does not isolate data from other applications running as the same user.

## Remote / remaining scope

Baseline CI [41363396551](https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer/actions/runs/41363396551) initially failed in `test:studio` (`DESTINATION_LINK_REFUSED`). It did not reproduce locally. First rerun request failed with TLS handshake timeout; attempt 2 then passed all workflow steps on the unchanged starting SHA at 2026-11-02T04:47:21Z. The transient failure remains an intermittent baseline issue, not an invented source fix. A new delivery SHA's CI must be checked separately.

Final preview checkpoint: Vite still PID 8540, Electron PID 1840 (launcher 19124), a real Windows window handle observed, port 9333 bound to loopback. Electron was relaunched through the existing `scripts/electron-run.cjs` helper as a detached hidden-console process, retaining its visible desktop window. Live stdout/stderr are outside Git at `D:\Temp\knoux-gemini-live-20261102`. Renderer/process termination and unresponsiveness now produce explicit lifecycle diagnostics. Home/Scan eight-state checks passed again on that instance at 2026-11-02T04:51:07Z.

No new branch/worktree, force operation, release/deployment, privileged repair, account connection or owner file/service/registry mutation belongs to this checkpoint. Remaining mission work is explicit in `LEGACY_UNIQUE_CAPABILITY_RECONCILIATION.md`.
