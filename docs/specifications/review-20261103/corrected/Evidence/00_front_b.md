---

## Part 7 — Cross-Cutting Technical Specifications

### 7.1 WinGet (services D05.08 Software Update Center and D05.10 Package Center & WinGet Browser; consumers D05.06, D02.08, D01.03)

#### 7.1.1 Existing behaviour **[OWNER] — Codex confirms by reading the file**

| Item | Statement |
|---|---|
| Provider file | `apps/gemini-ui/electron/native/app-bridge.cjs` |
| Functions | `detectWinget()`, `updates()`, `packages()`, `parseWingetTable()` |
| Interface | **WinGet CLI** (`winget.exe`), not COM and not the PowerShell module |
| D05.08 | `winget.exe upgrade --include-unknown --disable-interactivity` — read-only upgrade **discovery** |
| D05.10 | `winget.exe search <validated-query> --disable-interactivity` — read-only package **discovery**; installed AppX/MSIX packages also come from local application inventory |
| Source agreements | **Not accepted automatically** (no `--accept-source-agreements`) |
| Executors | **None verified.** The registry says "absent (gated)" and "no install or source agreement" **[PACK]**; the owner directs that no installation/upgrade engine be described as existing unless a real executor is found in source |

**[WEB] Verified flag semantics** (Microsoft Learn, `winget upgrade`): `--include-unknown` upgrades/lists packages whose current version cannot be determined; `--accept-source-agreements` "accepts the source license agreement and avoids the prompt"; `--accept-package-agreements` "accepts the package license agreement and avoids the prompt"; `--disable-interactivity` disables interactive prompts; `--all` skips pinned packages unless `--include-pinned`.

#### 7.1.2 Verified missing capabilities (to be re-confirmed in source)

1. No executor for install, upgrade, uninstall, repair or pin handling (D05.06 uninstall and D05.08 update are `GATED_PREVIEW_ONLY`).
2. No explicit **source-agreement state**: with `--disable-interactivity` and no `--accept-source-agreements`, a first-run or reset profile can make the CLI fail instead of listing. The product must distinguish "WinGet absent", "WinGet present, agreements not accepted", "source unreachable", "parse failure" and "no upgrades" — five different states with five different messages.
3. The table parser (`parseWingetTable()`) is a text parser over localized, width-dependent output. Required hardening is in 7.1.5.
4. No capture of the CLI exit code and stderr as structured evidence.
5. No per-package license/agreement preview, no postcondition verification, no journal, no honest "no rollback" statement.

#### 7.1.3 Required design — discovery (D05.08, D05.10) **[REQ]**

- **Detection (`detectWinget`)**: resolve `winget.exe` to an absolute path in Main (the App Execution Alias lives under the user's `WindowsApps` directory; do not rely on `PATH` inside a `shell`); run `winget.exe --version` through SP-06; record version, resolved path and sample time in the capability registry. Absent → `provider-missing` with remediation "App Installer (Microsoft.DesktopAppInstaller) is not available"; UI offers the Windows Settings/Store hand-off already used elsewhere, never a download from KNOuX.
- **Argument safety**: `search` queries pass a validator (length ≤ 128, Unicode letters/digits/space/`.-_+` only, must not begin with `-`, no control characters). Prefer the explicit `--query <q>` form so a query can never be parsed as an option; assert in a test that `-x`, `--help`, `"a & b"`, `"..\\"` and a 10 000-character string are rejected before any process starts.
- **Output contract**: capture `exitCode`, `stdout`, `stderr`, `durationMs`, `locale`, `codePage`, `wingetVersion` in a bounded evidence record. Never log package names beyond what the UI already shows.
- **Source-agreement handling**: classify the failure by running a fixed read-only probe on a clean fixture and recording the exact exit code and stderr text into `fixtures/winget/` (**do not hardcode a code from this document**; capture it). On that classification the capability becomes `needs-consent` with reason `WINGET_SOURCE_AGREEMENT_REQUIRED`. The UI shows the agreement text exactly as emitted by WinGet's own output (captured once by a user-initiated, non-silent invocation) and links to Microsoft's documentation. Only after the user presses an explicit "I accept the WinGet source terms" control does Main re-run the **same read-only discovery** once with `--accept-source-agreements` for that single invocation; the acceptance (time, WinGet version, source name) is journaled. KNOuX never passes the flag by default and never persists acceptance as a standing flag. (Default policy; the owner may change it — Part 10, D-5.)
- **Discovery output**: `{id, name, installedVersion, availableVersion, source, matchKind: exact|unknown-version|pinned|requires-explicit-targeting}`. Rows from the "require explicit targeting" section are labelled, not merged into the normal list. `--include-unknown` rows carry `installedVersion: "unknown"` and are never presented as "update available" without that label.
- **Cancellation**: kill the process tree via SP-06 and report `cancelled` with no partial list shown as complete.
- **Cache**: in-memory + persisted last result with `sampleTime`; stale results are labelled stale; never shown as current.

#### 7.1.4 Required design — execution (D05.08 upgrade; D05.10 install; D05.06 uninstall) **[REQ — Class C]**

This is **new work** and must not be described as existing.

1. **Preflight (read-only)**: `winget show --id <exact id> --exact --source <source>` (through SP-06) to obtain publisher, version, installer type, scope, license/agreement text and homepage. Show it. Reject ambiguous IDs; require exact ID + source.
2. **Plan**: `{operation: install|upgrade|uninstall, id, source, targetVersion?, scope?, installedVersionBefore, expectedVersionAfter, wingetVersion, agreementsShown[], hash}`. Immutable and bound to the resource fingerprint (installed version at plan time). Bulk upgrade ("update all") is **not** a single operation: it expands to one plan item per package, each individually listed and individually consented or explicitly batch-consented with the full list visible. Pinned packages are excluded unless the user includes them.
3. **Consent**: in-app control + native dialog showing package, versions, source, "may request administrator approval", "cannot be automatically undone", and the package/source license text status. Package agreements are accepted per package, per run, only after the user has seen them; only then pass `--accept-package-agreements`. Source agreements follow 7.1.3.
4. **Execution**: `winget.exe upgrade|install|uninstall --id <id> --exact --source <source> --disable-interactivity [--version <v>] [--silent]` via SP-06. **KNOuX does not elevate**; if the installer needs elevation, the installer itself triggers UAC (a Windows-owned prompt). Run one package at a time; timeouts are per package; progress is *indeterminate* unless the CLI emits a measurable value.
5. **Cancellation**: before the installer phase starts, kill the tree and report `cancelled`. After the installer has started, offer "stop waiting" rather than "cancel", state that the installer may still complete, and fall through to verification.
6. **Postcondition**: re-read installed state (`winget list --id <id> --exact` and the local inventory) and compare to `expectedVersionAfter`. Exit code 0 with a wrong version is `E_VERIFY`. Non-zero exit with the expected version present is reported as "completed with installer warning", with the code captured.
7. **Recovery**: WinGet offers no general rollback. Record the previous version; offer "reinstall previous version" only if the source manifest lists it (checked by `winget show --versions`), labelled best-effort. **Never claim undo.** Uninstall is irreversible except by reinstalling; say so.
8. **Journal**: per package: plan hash, WinGet version, command template ID (not raw text with user data), exit code, versions before/after, verification result, agreement acceptances.
9. **Disposable testing**: tests use a **mock `winget.exe`** (a fixture executable that replays recorded transcripts, including agreement-required, localized headers, truncated columns, non-zero exits, hangs and installer-started-then-cancelled) and never touch the real package manager. A real-WinGet run is a separate `BLOCKED_REQUIRES_USER_ACTION` live gate performed only with a user-selected disposable package.

#### 7.1.5 Parser hardening (`parseWingetTable`) **[REQ]**

- Locate the header row by the separator line of dashes (`-----`), not by English header text; derive column offsets from the separator line's dash groups.
- Strip carriage-return progress/spinner frames (`\r`, `-\|/` runs) and ANSI sequences before parsing.
- Handle truncation markers (`…`) by labelling the field truncated and never re-using a truncated ID for an operation (re-query by exact name through `winget show` instead).
- Handle wide (CJK/Arabic) characters by display width, not code units.
- Required fixtures: English, Arabic, German, Japanese header locales; narrow and wide console widths; `Unknown` versions; the "require explicit targeting" trailer; zero results; agreement-required failure; garbage output (`E_PARSE`, never a half-parsed list).
- The parser returns `{rows, truncated, sectionsSeen, warnings}`; any unrecognized structure yields `E_PARSE` with the first 200 sanitized characters in the diagnostics log only.

#### 7.1.6 Acceptance tests for the WinGet chapter (also referenced from D05.06/08/10)

| ID | Test |
|---|---|
| WG-01 | `detectWinget()` against mock-absent, mock-present, alias-broken fixtures yields `provider-missing`, `available`, `provider-missing` with distinct reasons |
| WG-02 | Agreement-required transcript → capability `needs-consent`; no agreement flag is ever sent before explicit user acceptance (assert the argv recorded by the mock) |
| WG-03 | After acceptance, exactly one discovery run carries `--accept-source-agreements`; the next run does not |
| WG-04 | Option-injection corpus (`-x`, `--help`, quotes, `&`, newlines, long input) is rejected before spawn; the mock records zero invocations |
| WG-05 | Localized/narrow/wide/truncated/unknown/explicit-targeting fixtures parse to the golden JSON; garbage → `E_PARSE` |
| WG-06 | Upgrade plan hash changes if installed version changes between plan and approval → `E_STALE_PLAN` |
| WG-07 | Upgrade executes with exact `--id --exact --source` argv, no shell, no elevation; mock exit 0 + unchanged version → `E_VERIFY` |
| WG-08 | Cancel before installer start → process tree gone, state `cancelled`; cancel after installer start → state "stop waiting", verification still runs |
| WG-09 | Bulk "update all" produces N individually visible plan items; pinned excluded; one failure does not mask others |
| WG-10 | Uninstall states irreversibility before consent and after completion; no Undo control exists |
| WG-11 | Packaged Electron repeats WG-02, WG-04, WG-07 against the mock executable |
| WG-12 | Journal contains no secret, no unredacted user-entered query beyond the validated string |

### 7.2 Google OAuth, scopes and verification (Domain 04, D14.03)

#### 7.2.1 What the project currently requests **[PACK]**

- **Google Sheets (`mission-04-01`)**: main-process OAuth (PKCE) + DPAPI/`safeStorage` + read-only Sheets API v4, "four fixed scopes", no token in the renderer, 14 offline `test:google` checks, `googleOk` (disconnected) in dev/packaged smoke. Live consent and a live Sheets read **NOT PERFORMED**. Requires a configured Google client (`OWNER_ACTION_REQUIRED`).
- **Gmail, Tasks, Forms, Contacts (People API), Calendar, Picker, Slides, Chat, Classroom**: **no provider and no scope** (fixture preview only).
- The `10-scope UI test` in the registry refers to ten service entries in the hub UI, **not** ten OAuth scopes.

**[REQ] First action (G-0):** read the four scope constants verbatim from the existing OAuth module and write them into a new `docs/GOOGLE_SCOPE_REGISTER.md` with: constant name, URL, feature using it, the label shown in Google Cloud Console's scope picker when added, and the date observed. The author cannot supply them from the pack and will not guess.

#### 7.2.2 Google's classification and what each class requires

**[WEB] Verified this session** — Gmail scope table (Google Workspace developer documentation, "Choose Gmail API scopes"):

| Class | Gmail scopes |
|---|---|
| Non-sensitive | `gmail.addons.current.action.compose`, `gmail.addons.current.message.action`, **`gmail.labels`** |
| Sensitive | `gmail.addons.current.message.metadata`, `gmail.addons.current.message.readonly`, **`gmail.send`** |
| **Restricted** | `https://mail.google.com/`, **`gmail.readonly`**, **`gmail.compose`**, `gmail.insert`, **`gmail.modify`**, **`gmail.metadata`**, `gmail.settings.basic`, `gmail.settings.sharing` |

Consequence: **there is no non-restricted way for a desktop app to read mailbox messages or even message metadata.** `gmail.metadata` is restricted. Sending-only (`gmail.send`) is sensitive, not restricted. Label management only (`gmail.labels`) is non-sensitive.

**[WEB] Verified** — restricted-scope verification (Google Identity): apps requesting restricted scopes that "can access Google user data from or through a third-party server" must complete a security assessment by a Google-empanelled assessor under the App Defense Alliance CASA framework, with re-verification at least every 12 months after the Letter of Assessment approval. The same page lists exceptions: personal use by you or a few people you know personally; development/testing/staging projects; service-owned data accessed via a service account; internal use within a Workspace/Cloud Identity organization; domain-wide installation (restricted/sensitive verification still applies there). **It does not explicitly say whether an app that only stores data on the user's own device is exempt from the assessment.** Therefore: *do not assume exemption and do not assume obligation* — it is a determination for Google's verification process and is recorded as blocker **B-G3**.

**[WEB] Verified (Google Cloud Help, OAuth app verification):** the Console labels each scope non-sensitive, sensitive or restricted when added; apps using only non-sensitive scopes need no verification but need brand verification to show name/logo; sensitive and restricted scopes require OAuth verification; restricted-scope apps are re-verified yearly.

**[WEB] Verified (People API page):** the scopes `contacts`, `contacts.readonly`, `contacts.other.readonly`, `directory.readonly` exist; that page does not state their sensitivity class.

**[RECALL — VERIFY in Console at implementation time; record the Console label as evidence]:** `openid`, `userinfo.email`, `userinfo.profile` are non-sensitive; `drive.file` is non-sensitive; `spreadsheets`, `spreadsheets.readonly`, `contacts*`, `directory.readonly`, `calendar*`, `tasks*`, `forms.*`, `presentations*` are sensitive; `drive`, `drive.readonly`, `drive.metadata*` are restricted; Chat and Classroom scopes vary and must be read from the Console label. External apps in **Testing** publishing status are limited to a small list of named test users (Google documents 100), see an unverified-app warning, and receive refresh tokens that expire after seven days when scopes beyond basic profile are requested; unverified production apps with sensitive/restricted scopes are capped at 100 lifetime users. These numbers are recalled, not re-fetched; Codex verifies them in the Console before any statement reaches the UI.

#### 7.2.3 Per-service scope and procedure matrix **[REQ]**

"Procedure" uses these codes: **T** = Testing status with named test users only (no verification; short-lived refresh tokens); **P0** = production, non-sensitive scopes only (brand verification only); **P1** = production, sensitive scopes (OAuth verification); **P2** = production, restricted scopes (OAuth verification **plus** security-assessment determination); **I** = Workspace-internal app (no public verification); **N/A** = no OAuth (library/embedded).

| Service | Minimum scope per feature | Expected class | Procedure for general users | Separate security assessment |
|---|---|---|---|---|
| D04.01 Sheets (read) | `spreadsheets.readonly` (+ identity) | sensitive | P1 | No |
| D04.01 Sheets (write/export) | `drive.file` + Picker/created-by-app sheets, avoiding `spreadsheets` | non-sensitive | P0 | No |
| D04.02 Gmail — send only | `gmail.send` | sensitive | P1 | No |
| D04.02 Gmail — labels | `gmail.labels` | non-sensitive | P0 | No |
| D04.02 Gmail — read messages/metadata/attachments | `gmail.readonly` or `gmail.metadata` | **restricted** | P2 | **Possibly — depends on Google's determination for a local-only client (B-G3)** |
| D04.02 Gmail — compose drafts | `gmail.compose` | **restricted** | P2 | Same |
| D04.03 Tasks | `tasks.readonly` / `tasks` | sensitive (verify) | P1 | No |
| D04.04 Forms | `forms.body.readonly`, `forms.responses.readonly`, `forms.body` | sensitive (verify) | P1 | No |
| D04.05 Contacts read | `contacts.readonly` (`contacts.other.readonly` for Other Contacts) | sensitive (verify) | P1 | No |
| D04.05 Contacts write | `contacts` | sensitive (verify) | P1 | No |
| D04.05 Directory | `directory.readonly` | sensitive (verify); Workspace only | P1 / I | No |
| D04.06 Calendar | `calendar.readonly` / `calendar.events` | sensitive (verify) | P1 | No |
| D04.07 Picker | `drive.file` (+ API key) | non-sensitive (verify) | P0 | No |
| D04.08 Slides | `presentations(.readonly)` + `drive.file` | sensitive (verify) | P1 | No |
| D04.09 Chat | Chat API scopes; Workspace account + Chat app configuration | read from Console | likely I or P1 | Verify |
| D04.10 Classroom | read-only course/roster/coursework scopes | read from Console | P1 / I | Verify |

**Rules (REQ):**
- Never claim that all Gmail or Contacts integrations need the same procedure. The UI and handover state the exact procedure **per feature** from this matrix once the Console labels are recorded.
- Request scopes **incrementally at first use**, narrowest first. Do not bundle unrelated services into one consent.
- A feature whose scope is not granted is disabled with the reason `SCOPE_NOT_GRANTED:<scope>`; a feature whose scope procedure is not completed is labelled `AVAILABLE_FOR_TEST_USERS_ONLY` when the app is in Testing status.
- **Restricted-scope data (Gmail) is never sent to any third-party AI provider, never used for model training, never exported by default, and is purged on disconnect.** Google's API Services User Data Policy "Limited Use" requirements apply and must be read by the owner before production (blocker B-G4). The spec's default is the strictest reading.
- If KNOuX ever introduces a KNOuX-operated server, relay or proxy that touches Google user data, the assessment analysis in B-G3 changes; no such component may be added without re-opening B-G3.

#### 7.2.4 Technical flow (shared) **[REQ]**

Installed-app authorization-code flow with PKCE, loopback redirect on an ephemeral port, opened in the user's default browser (never an embedded webview); `state` verified; code verifier never leaves Main; tokens only in Main under SP-08; single-flight refresh; failure → `needs-reauthorization`; disconnect calls Google's revocation endpoint, deletes local copies and caches, and reports revocation failure honestly; connected-account email/ID shown only from Google's response; API key (Picker) is a **separate** credential and a separate `needs-credential` item; typed clients with page-token bounds, partial-response field masks, backoff with jitter on 429/5xx, `Retry-After`, deadlines and cancellation.

#### 7.2.5 External blockers (Google) — specific

| ID | Blocker | Needed from | Effect until resolved |
|---|---|---|---|
| B-G1 | Google Cloud project, OAuth client (desktop type) and consent screen configured; client ID supplied as configuration (never in source) | Owner | Every D04 service `needs-credential`; implementation continues against mock server |
| B-G2 | Live consent by the owner's own account for a live read (Sheets first) | Owner at time of use | `BLOCKED_REQUIRES_USER_ACTION` live gate; offline status unchanged |
| B-G3 | Google's determination whether a local-only desktop client using restricted Gmail scopes must complete the CASA assessment | Google verification process, owner | Gmail read/compose limited to Testing status / named test users |
| B-G4 | Owner review of API Services User Data Policy Limited Use obligations before any production Gmail/Contacts release | Owner | Production release of D04.02 read and D04.05 withheld; Testing-status release only |
| B-G5 | Picker developer API key | Owner | D04.07 `needs-credential` |
| B-G6 | Chat: Workspace account + administrator allowance; Classroom: eligible account | Owner | D04.09/D04.10 `unsupported-account-type` or `blocked-by-admin-policy` |

### 7.3 Hardware sensors: battery, thermal, health, cycles (D10.26 battery, D10.30 cycles, D10.31 thermal, D10.36 report; consumers D13.11, D01.07, D02.09)

#### 7.3.1 Principles **[REQ]**

Every hardware measurement is **capability-driven**. A Windows device is not assumed to have a battery, an ACPI thermal zone, a cycle counter, a fan sensor or per-core temperatures. If a provider cannot produce a value, the UI shows an explicit unavailable state with a reason code. **No number is ever interpolated, defaulted, smoothed across a gap, carried forward as current, or synthesized for a chart.**

#### 7.3.2 Native provider chain

| Measurement | Provider order (first that returns a valid, non-constant, plausible value wins; every provider attempted is recorded) | Notes **[RECALL — VERIFY on fixtures]** |
|---|---|---|
| Battery presence, charge %, status, runtime | 1) `Win32_Battery` (CIM, `root\cimv2`); 2) `GetSystemPowerStatus` via a typed native call in Main | `Win32_Battery` is absent on most desktops; `BatteryFlag` 128 / no-battery means unsupported |
| Design capacity, full-charge capacity | `root\wmi` `BatteryStaticData.DesignedCapacity` and `BatteryFullChargedCapacity.FullChargedCapacity` | Health % = full ÷ design **only if both are present, positive and full ≤ design × 1.5**; otherwise unavailable |
| Charge/discharge rate, voltage | `root\wmi` `BatteryStatus` | Sign conventions vary; record raw and unit |
| Cycle count | `root\wmi` `BatteryCycleCount.CycleCount`; optional second source: `powercfg /batteryreport` output through SP-06 into an app-owned directory | Many firmwares report 0 or omit; a reported 0 is shown as "reported 0 (firmware may not track cycles)", never as "new battery" |
| Thermal zones | 1) `Win32_PerfFormattedData_Counters_ThermalZoneInformation`; 2) `root\wmi` `MSAcpi_ThermalZoneTemperature` | The second often needs elevation and is frequently static or absent; value is tenths of Kelvin; convert and record raw. Constant value across N samples is flagged `STATIC_NONUPDATING` |
| CPU package/core temperature, fan RPM, voltages | **No default provider.** WMI does not expose them reliably | Obtaining them needs a vendor library or a kernel driver. **Third-party sensor drivers are not bundled** (decision D-4); the UI states "not exposed by Windows on this device" |
| GPU temperature | Optional vendor CLI only if the executable is present at a known location, signature-verified, invoked read-only through SP-06 (e.g. NVIDIA's own tool) | Absent → `provider-missing`; never a guess |

Elevation is **never** requested automatically for a read. If a provider returns `ACCESS_DENIED`, the capability becomes `needs-elevation` with the reason shown; the user may choose "retry elevated" only if SP-07 supports that fixed read operation, else the sensor stays unavailable.

#### 7.3.3 Capability detection and unsupported-device behaviour

On first open and on refresh, run the chain once and persist `{measurement, status, reasonCode, provider, sampleTime, hostId}`. Reason codes: `NO_BATTERY`, `CLASS_NOT_PRESENT`, `FIRMWARE_NOT_REPORTING`, `ACCESS_DENIED`, `STATIC_NONUPDATING`, `IMPLAUSIBLE_VALUE`, `VM_GUEST`, `PROVIDER_TIMEOUT`, `NOT_EXPOSED_BY_WINDOWS`. Behaviour by device:

- Desktop/no battery → battery and cycles services show "No battery detected on this device" and nothing else; automation battery gating treats power as `AC (assumed unknown→pause)` per the existing rule that unknown power pauses for owner review **[PACK]**.
- Laptop with partial data → show what exists (e.g. charge but no cycle count) and mark each missing field with its reason.
- Virtual machine → `VM_GUEST`; show hypervisor-provided values only if present, flagged.
- Sleep/hibernate gaps → charts show a gap, not a line across it.

#### 7.3.4 Timestamp and provenance (per value) **[REQ]**

`{value, unit, rawValue, rawUnit, provider, providerClass, sampleTime (ISO-8601 with offset, source: main process wall clock at read completion), monotonicMs, reliability: reported|derived, hostId (stable hash), appVersion, ageMs}`. "Derived" is allowed only for documented arithmetic (health % = full ÷ design). Exports carry a header with host, app version and provider list. The Sample store (SP-11) persists only real samples with their timestamps.

#### 7.3.5 Tests (shared by D10.26/.30/.31/.36)

| ID | Test |
|---|---|
| HW-01 | Mock provider "desktop": battery services report `NO_BATTERY`; no chart, no placeholder values |
| HW-02 | Mock "laptop full": charge, status, design/full capacity, cycles, thermal all populate with provenance |
| HW-03 | Mock "laptop partial": cycle count absent → field shows reason; health % hides if either capacity is missing |
| HW-04 | Mock "static thermal": same value for N samples → `STATIC_NONUPDATING`, no trend line |
| HW-05 | Mock "access denied" → `needs-elevation`, no auto UAC, no value |
| HW-06 | Mock "implausible" (e.g. −273 °C, 2000 °C, full capacity ≫ design) → `IMPLAUSIBLE_VALUE`, value withheld |
| HW-07 | Sleep gap in the sample store renders as a gap in the chart DOM (no point between) |
| HW-08 | Source scan: no code path writes a literal temperature/battery number into a result; unit test greps providers for numeric literals in sample paths |
| HW-09 | D10.36 report contains only measured sections plus an "unavailable (reason)" list, content hash and generation time |
| HW-10 | AR/EN strings exist for every reason code |

### 7.4 Disk reliability / S.M.A.R.T. (D07.10, D10.32, D07.07)

`storage-smart` is `UNSUPPORTED` today **[PACK]**: Storage has no physical-disk provider and "separate System hardware data is not silently substituted". The spec's route: provider chain `MSFT_PhysicalDisk` (health, operational status, media type, bus type) → `MSFT_StorageReliabilityCounter` (temperature, wear, power-on hours, read/write error totals, where the driver supports it) → `root\wmi MSStorageDriver_FailurePredictStatus` (predict-failure flag) → NVMe health log via a typed `IOCTL_STORAGE_QUERY_PROPERTY` call in Main (no process, read-only) — each **[RECALL — VERIFY]** and each capability-detected per disk. Correlate to volumes by the chain disk → partition → logical disk. No attribute table is shown unless the device returned it; no overall "health score" is invented — show vendor/Windows-reported status text and raw counters with provenance. A disk behind USB bridges, RAID or virtualization is `unsupported-hardware` with the reason. Same sample/provenance rules as 7.3.4.

### 7.5 Elevation broker (SP-07) **[REQ]**

- A purpose-built helper executable, signed in production, accepting **only** a fixed operation enum (e.g. `dism-checkhealth`, `dism-scanhealth`, `dism-restorehealth`, `sfc-verifyonly`, `sfc-scannow`, `flushdns`, `winsock-reset`, `tcpip-reset`, `service-set-start-type`, `hosts-write`, `schtasks-create/delete`, `wu-reset-step`, `recycle-empty`), each with a typed argument schema.
- The helper receives the operation as a plan file whose `planHash` it recomputes and compares with a value the **non-elevated Main** signed with a per-session HMAC key delivered over an ACL-restricted named pipe; the helper re-validates every argument and path against the same protected-path catalog and refuses on mismatch.
- UAC is raised by the OS for the helper launch (`runas`), once per approved operation. No persistent elevated service. No elevation of the Electron renderer or Main.
- **Refuse to elevate** if the helper or its entry files live in a user-writable directory (development/`win-unpacked` outside Program Files) unless the process is in the explicit mock test profile; this prevents elevating attacker-writable code.
- Progress/result return over the pipe; the non-elevated side performs the postcondition read-back independently.
- Without the helper (not yet built or unsigned), every dependent service reports `needs-elevation` with reason `ELEVATION_HELPER_UNAVAILABLE`; the executor is still implemented and tested against the mock helper.

### 7.6 Scheduling (D08.11, D09.10, D13.01–D13.12)

Existing: foreground, in-app, explicitly armed recurrence with quiet-hour and measured-power guards, per-occurrence native confirmation, pause/rearm, protected run artifacts; no Windows task, no startup entry **[PACK]**. Required extension: an **optional OS-level schedule** created through `schtasks.exe` via SP-06 with a fixed XML template (current user principal, least privilege, never "highest"), consented as a Class B action, journaled (task name, XML hash, created/removed), verified by reading the task back, removable by KNOuX. An OS-triggered run launches KNOuX with a signed run-token argument and executes **only read-only DAG nodes** unless a bounded, user-created pre-approval (D14.04) covers the exact plan hash; otherwise it records a pending-review item (surfaced by D01.12). Unknown power evidence pauses. DST: store the schedule as (local wall time, IANA zone) and recompute next fire from the zone database; tests include spring-forward and fall-back transitions.

---

## Part 8 — Testing and Evidence Framework

### 8.1 Verification layers (a higher layer is never inferred from a lower one)

L0 static (`lint` = TypeScript check, `ledger:check`) · L1 unit/contract · L2 provider tests against mocks (mock registry, mock SCM, mock `winget.exe`, mock OAuth/API server, mock hardware) · L3 disposable-fixture native tests on a Windows host (real filesystem effects, locks, junctions, long paths) · L4 isolated Electron dev smoke · L5 packaged Electron (`win-unpacked`) smoke · L6 Windows-native host behaviours (UAC, DPAPI, real SCM/registry on a **disposable test machine/VM profile**) · L7 owner-consented real-data run (`BLOCKED_REQUIRES_USER_ACTION` until the owner performs it) · L8 visual/accessibility matrix · L9 production (signing, auto-update, Google verification).

### 8.2 Re-audit procedure for every `MEASURED_READ_ONLY` / `UNASSESSED` service (first action per service)

Answer the 15 questions in writing in the evidence record: (1) what exists and where (file + symbol); (2) real data?; (3) action executor?; (4) does it need one?; (5) typed preload/IPC wired?; (6) state persists across restart?; (7) cancellation reaches the real walker/process?; (8) result verifiable after the fact?; (9) user recovery from errors?; (10) fixture tested?; (11) real Electron?; (12) packaged?; (13) owner data with consent?; (14) what remains; (15) which branch holds unmerged work. Then set the status from Part 3.2.

### 8.3 Mandatory test categories per class

- **A:** provider-real fixture; provider-unavailable; partial result; large result paging/virtualization; cancel mid-read; refresh; export with provenance header; EN/AR; no fabricated value (source scan + fixture with empty provider).
- **B:** everything in A where relevant plus preflight; plan hash; stale plan; changed-resource refusal; traversal/symlink/junction/protected-path refusal; consent required (direct IPC call without consent is refused); execution effects on disposable fixtures; postcondition; cancellation (effects stop, partial journaled); crash/interruption recovery; undo with conflict check; restart reconciliation.
- **C:** everything in B plus protected-default refusal; elevation required/denied/mock-granted; irreversible warnings present before and after; no Undo UI for irreversible effects; effect verification independent of exit code.
- **D:** consent flow against the mock server; token never in renderer/logs/exports (scan for the test token); scope downgrade disables controls; refresh failure → `needs-reauthorization`; revoke + purge; quota/backoff; idempotency; offline vs API error distinct; live gate recorded separately.

### 8.4 Evidence record **[REQ]** — one JSON per verified claim, committed under a **new** `docs/evidence/<topic>-<yyyymmdd>/` directory

`{claimId, serviceIds[], statusClaimed, layer, command, exitCode, counts {pass, fail, skip}, commitSha, dirtyTree: bool, host {os, build, arch, locale, dpi}, electronVersion, packaged: bool, fixtureDescription, effectsObserved[], artifacts[] (screenshot/log paths + SHA-256), limitations[]}`. A claim without a record is not a claim. Screenshots alone never support a functional claim. Test doubles are labelled `mock` in the record.

### 8.5 UI verification matrix (every mounted workspace)

Viewports 1366×768, 1672×941, 1920×1080 · English and Arabic (RTL) · Day and Night · reduced motion · keyboard-only operation · focus restore on close · side-dock and expanded workbench modes · no overlap/clipping of operable controls · bidi isolation of paths/hashes/commands · no dead button (every enabled control has an effect or is disabled with a visible reason).

### 8.6 Existing test commands (named in the pack; run from `apps/gemini-ui`) **[PACK]**

`lint`, `test:theme`, `test:i18n`, `test:home`, `test:navigation`, `test:workbench`, `test:google`, `test:apps`, `test:files`, `test:storage`, `test:studio`, `test:system`, `test:automation`, `test:settings`, `build`, `ledger:check`; native: `startup-actions-test`, `startup-native-test`, `service-actions-test`; smoke flags `*WorkbenchOk` / `*WorkbenchLayoutOk`, `googleOk`; visual capture: `scripts/visual-fidelity-capture.mjs` (new output directory each time). Never run `clean`.

### 8.7 Test hygiene

Fixtures live in disposable temp trees created per test and removed by the test (never outside its own root). No test touches the owner's folders, registry (outside a dedicated test key), services (outside the mock SCM), startup entries, network settings or accounts. Real-effect tests that need Windows run only on a Windows host and say so; a skipped test is reported as skipped, never as passed.

---

## Part 9 — Git, Branch and Worktree Procedure

**Step 0 (read-only; record verbatim output in `docs/evidence/codex-start-<yyyymmdd>/git-state.txt`)**
`python scripts/verify-workspace.py` · `git rev-parse HEAD` · `git status --porcelain=v1 -uall` · `git branch -a -vv` · `git worktree list` · `git stash list` · `git ls-remote origin refs/heads/main` · `git log --oneline --graph --decorate -n 40 --all` · for each of `e819b2c`, `2a7fcbd`, `71240ce`: `git merge-base --is-ancestor <sha> HEAD; echo $?` · for each of `codex/service-workspaces-20261101`, `openhands/native-services-20261102`, `openhands/native-services-cloud-20261102`, `codex/knoux-all-services-execution-20261102`, `origin/v0/knoux-smartorganizer-integration-b432675e`: `git log --oneline HEAD..<ref>` and `git diff --stat HEAD...<ref>` (ignore a ref that does not exist; record that it does not).

**Preservation:** create outside the repo a `git bundle --all`, tags for unique tips, and patch exports of unstaged/staged changes before any branch operation. Verify the protected visual checkpoint directory is intact. Do not use ignored archives or external backups as disposable.

**Integration:** use the existing canonical repository and branch; the standard forbids new clones, extra worktrees, external mission folders and parallel backups for ordinary development. Where isolation is needed for another agent's unique work, **cherry-pick specific reviewed commits** or apply reviewed patches; never wholesale-merge PR #4's older layout/dashboard over working services (verify every donor fragment against current source); never auto-merge OpenHands or historical branches. Preserve both sides' intent on conflict; re-run tests. Publication follows the owner's normal reviewed workflow (commit/push/CI/fast-forward as already authorized); confirm the resulting remote SHA and the exact-SHA CI run. No force-push, no history rewrite, no branch deletion. Do not mix old Root CI.

**Ownership boundaries:** visual files and the three leased files belong to the visual continuation; native/IPC/contracts/service bodies belong to this execution. Shared `native-contracts.ts`: additive.

---

## Part 10 — Owner Decisions and Blockers

Only decisions that are genuinely the owner's, plus external authorizations. Each has a **default Codex follows until the owner decides**, so no work stops.

### 10.1 Product-policy decisions

| ID | Decision | Default until decided |
|---|---|---|
| D-1 | Google distribution posture: remain in **Testing/personal-use** mode (named test users, short-lived tokens) or pursue production verification (P0/P1/P2 per Part 7.2.3) | Testing mode; no UI claims general availability |
| D-2 | Whether to pursue Gmail **read/compose** (restricted) at all, versus `gmail.send` + `gmail.labels` only | Implement read path behind `needs-credential`; ship only for test users; production withheld (B-G3, B-G4) |
| D-3 | AI data classes permitted to leave the machine per provider (findings summaries, receipts, file names) | None beyond the user's typed question; file contents and credentials never; restricted Google data never |
| D-4 | Whether to bundle a third-party hardware-sensor library/kernel driver for CPU/fan telemetry | Not bundled; those sensors report `NOT_EXPOSED_BY_WINDOWS` |
| D-5 | Whether KNOuX may ever accept WinGet source/package agreements on the user's behalf as a standing setting | Never standing; per-invocation after explicit in-app acceptance |
| D-6 | Whether to allow PURGE (permanent delete) of quarantined items | Disabled by default (D14.04 guard); implemented behind the guard and consent |

### 10.2 External authorization and credentials (specific blockers)

| ID | Blocker | Services | State until resolved |
|---|---|---|---|
| B-G1…G6 | See 7.2.5 | D04.*, D14.03 | `needs-credential` / `BLOCKED_REQUIRES_USER_ACTION` |
| B-S1 | Code-signing certificate | D05.08/10 helper trust, SP-07 helper, installer, auto-update | Unsigned dev builds; elevation helper refuses outside mock profile; production gate L9 open |
| B-S2 | Elevated Windows test machine/VM profile | D11, D10.24, D12 policy, D08.07/08, D09 machine scope | Executors proven on mocks; L6 `NOT_RUN` |
| B-S3 | AI provider key | D14.02, D14.08 | `needs-credential`; rule-based explainers continue |
| B-S4 | Real USB/removable device and physical-disk SMART-capable hardware | D07.10/.12 | Mock-proven; `NOT_RUN` on hardware |
| B-S5 | Owner-consented real-data runs | all class B/C | L7 `BLOCKED_REQUIRES_USER_ACTION` |
| B-S6 | Owner visual sign-off (gate 10 in Studio ledger) | all UI | Visual acceptance stays `NOT_ACCEPTED` |

---

## Part 11 — Dependency Order of Work (not a schedule)

An item may start when everything it depends on is verified; independent items may proceed in any order. No durations are implied.

1. **Step 0 and the crosswalk** (Part 9; §1.1).
2. **Shared platform SP-01…SP-14** (Part 4), starting with SP-01 capability registry, SP-02 coordinator, SP-05 journal, SP-06 process runner, SP-12 fixture lab; then SP-04 plan store, SP-03 scope manager, SP-13 consent UI, SP-14 i18n; SP-07 elevation broker; SP-08 secret store (exists for Google; extend).
3. **Re-audit** of every `MEASURED_READ_ONLY`/`UNASSESSED` service (Part 8.2), producing evidence records and corrected statuses — this unlocks accurate planning.
4. **Domain 03 Studio** and **Domain 06 Files** organization effects (already fixture-implemented): packaged verification, scope/rule gaps, stronger undo conflict handling.
5. **Domain 07 Storage** and **Domain 08 Cleanup** executors beyond authorized-folder quarantine (Recycle Bin, caches, logs, servicing cache), then **Domain 02 Smart Scan** hand-offs.
6. **Domain 09 Startup** (HKCU Run exists; extend to machine Run, startup folder, tasks, services, delay), **Domain 12 Services** policy/restart, then **Domain 11 Repair** executors (need SP-07), **Domain 10.24** network repair.
7. **Domain 05 Applications** (WinGet executor per 7.1, uninstall, leftovers, associations hand-off).
8. **Domain 10** observation gaps (capability-driven hardware, 7.3/7.4), probes with consent.
9. **Domain 13 Automation** (OS scheduler, conditions, mutation nodes under pre-approval, notification transports), **Domain 14 Settings** (engine limits, guards, AI proxy, backup).
10. **Domain 04 Google Workspace** (provider by provider against the mock server), **Domain 01 Home** last because it aggregates the others.
11. Gates: packaged verification, visual/accessibility matrix, owner consent runs, production gates — recorded separately as they become possible.
