KNOuX SmartOrganizer — Ultimate 181-Service Product Completion & Production Engineering Specification
Volume 1 of a multi-volume specification · Authored for the Codex implementation agent · Dated 2026-11-02
0. Volume Map and Authoring Status
The full specification is delivered in numbered, complete volumes so that nothing is silently omitted.
CORRECTED 2026-11-03: the status column below originally read "Not yet written" for Volumes 3–5 and "Blocked on repository access" for Volume 6. Those lines described the authoring session, not the delivered package, and contradicted the files actually shipped. They are replaced here so the package carries one delivery statement only. The delivered structure is:
Volume file
Contents
Status as delivered
Spec/Volume_1_Sections_01-22.md
Sections 1–14 (evidence discipline, Git reality, architecture, registry reconciliation, the 181-entry master inventory, gap framework, the mandatory 12-part contract template, the acceptance framework, the Git/worktree procedure, security baseline, blockers, the Codex execution contract) and Sections 15–22 carrying the per-service contracts for Domains 02 Smart Scan (10), 01 Home (12), 06 Files (12), 07 Storage (12), 08 Cleanup (12), 09 Startup (12), 11 Repair Lab (12), 12 Services (12)
Delivered; Domain 03 in Section 9
Spec/Volume_2_4-5_Sections_23-31.md
Sections 23–27: Domain 10 System/Network/Hardware (36), 05 Applications (12), 13 Automation (12), 04 Google Workspace (10), 14 Settings/Engine/AI (8)
Delivered; its Storage addendum is superseded — see the reconciliation note at the head of that section
Spec/Volume_3_6-7_Sections_32-43.md
Sections 32–43: evidence reconciliation, the WinGet / Google-scope / hardware-sensor determinations, the 181-row acceptance matrix (Section 40), the per-service evidence addenda with acceptance test IDs (Section 41), the consolidated blocker list (Section 42)
Delivered; Section 40 is superseded column-by-column by Matrix/matrix_181_v2.csv
Spec/Volume_4_8_Sections_44-50.md
Sections 44–50: shared product-wide capabilities, the unified service workspace contract, native provider architecture, persistence and recovery, cross-domain integration contracts, regression protection, packaged-runtime acceptance
Delivered
Contracts/ (14 files + index)
All 181 entries re-expressed in the full A–L structure, with the parts the volumes left out filled from measured source and the parts that cannot be established written as Codex tasks
Added by this correction pass
Matrix/ + build/
The reconciled 181-row matrix, the revalidation queue, the native binding map and the scripts that regenerate all of them
Added by this correction pass
Per-service entries use the 12-part template defined in Section 8 of this volume. Domain 03 is written first because it is the product's founding purpose and carries the highest data-loss risk.
1. Document Control and Evidence Snapshot
1.1 Evidence basis
This volume is written without repository access. An attempt to read https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer/tree/main was refused by the site's automated-access policy (robots disallow). No source file, ledger, CSV, commit, test log or screenshot has been read by the author.
CORRECTED 2026-11-03 — WHAT THIS PARAGRAPH DOES NOT MEAN. Repository access was unavailable to the *author*. That is a statement about authorship provenance, not a licence to treat this document or the archived ledgers as the truth about the product. The precedence order is fixed by 01_PRECEDENCE_AND_BASELINE.md and is, in one line: **running behavior on a Windows host beats the source tree; the source tree beats the tested SHA; the tested SHA beats a recorded evidence file; a recorded evidence file beats any specification sentence about current state.** This specification defines required behavior. It never overrides a newer verified implementation, and a conflict between it and the code is resolved by correcting the document, not by reverting the code. Where this volume says NOT VERIFIED, read 01_PRECEDENCE_AND_BASELINE.md and Matrix/matrix_181_v2.csv first: a large part of those NOT VERIFIED markers has since been resolved by direct source inspection, and the answer is recorded there with a file and line.
Consequently every statement in this document belongs to exactly one evidence class:
Class
Meaning
SUPPLIED
Stated by the owner in the authoring directive (product identity, service names, counts, SHAs, paths, branch names, ownership split)
DERIVED
Engineering inference from SUPPLIED facts and Windows/Electron platform behavior; testable but not yet confirmed against code
NOT VERIFIED
A fact about current source, behavior, tests or runtime that only repository inspection can establish
REQUIRED
A requirement Codex must implement or prove
Wherever this document would otherwise need to state what the code currently does, it states NOT VERIFIED and gives the exact inspection that resolves it. No command output, symbol name, file path inside src/, or IPC channel name has been invented. Where a path is listed it comes from the directive and is marked SUPPLIED; its existence is NOT VERIFIED.
1.2 First action for Codex
Before implementing anything, Codex runs the read-only inspections in Section 3.3 and replaces every NOT VERIFIED in the Domain chapters with an evidence-backed status. That replacement is itself a deliverable (Vol. 6 matrix).
2. Executive Product Definition
Product (SUPPLIED): KNOuX SmartOrganizer, Windows desktop, Electron + React + TypeScript + native Windows service integration. One application, fourteen functional domains, 181 registered service entries, one integrated experience.
Founding purpose (SUPPLIED): intelligent file organization. A user authorizes folders; the application inventories and categorizes real files; the user customizes rules and destinations, reviews a complete plan, approves; the native engine executes only approved operations; results are verified, journaled and, where supported, undoable. Every other domain supports this mission or extends it into system management, diagnostics and automation.
Non-negotiable product properties (REQUIRED):
1. No displayed metric, progress value, scan result, file list or history entry may be fabricated. Absence of data is shown as an honest state, never as demo content.
2. No owner file is silently overwritten or deleted. Destructive effects go through preview, plan-bound approval, quarantine or journaled move, and verification.
3. The renderer is untrusted. Every privileged operation is validated and authorized again in Electron Main.
4. Existing work is preserved: Living Glass headers, transparent artwork, orbital engine, compact selectors, workbenches, existing native engines and verified execution/undo work are extended, never replaced by simplified versions.
5. Read-only observation services are complete when they observe accurately and say what they cannot observe. They are not defective for being unable to modify the system.
3. Verified Git and Repository Reality
3.1 Supplied observations (historical, not baselines)
CORRECTED 2026-11-03: the values in this table are a dated observation made by the author from outside the repository, and they were already stale when the package shipped. Measured directly in the canonical checkout during this correction pass, the branch then called "last observed local main" (`8ff8131…`) was **four commits behind** the real local `main` tip. Do not use any row below as a baseline; use 01_PRECEDENCE_AND_BASELINE.md, and re-measure before acting, because the checkout is being written to by other agents while documents are being read.
Item
Value
Class
Repository
daynightae-cmyk/KNOuX-Gemini-SmartOrganizer
SUPPLIED
Canonical local workspace
D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer
SUPPLIED
Last observed local main
8ff81311e0b1cfae7c80080baea4d8338512fbef
SUPPLIED
Previously observed remote-tracking main
8871103c7fd2a274a70fe2a069bb435f2ccb12ac
SUPPLIED
Local-only commits at inspection
2 commits on local main absent from local origin/main
SUPPLIED
Dirty state at inspection
5 modified tracked files
SUPPLIED
Known branches / worktrees
main, codex/service-workspaces-20261101, openhands/native-services-20261102, additional OpenHands conversation worktrees
SUPPLIED
Earlier historical visual baseline
41a3768bb2b83111fa7e29aa38473d9980ca6e14 (local)
SUPPLIED (earlier mission brief)
Concurrent agents
Codex (visual / workspaces) and OpenHands (native services)
SUPPLIED
Every SHA above is a historical observation. Codex must re-observe them.
3.2 Consequences (DERIVED)
• GitHub main cannot be assumed to contain the product's current best state. Two local commits and five uncommitted modifications may hold unique work.
• An older remote main is not a safe base for new work.
• Visual work may exist only locally; backend work may exist only on openhands/* branches or worktrees.
3.3 Mandatory read-only inspection (Codex runs, records output verbatim)
git rev-parse --show-toplevel
git rev-parse HEAD
git status --porcelain=v2 --branch
git remote -v && git fetch --all --prune
git branch -a -vv
git worktree list --porcelain
git stash list
git reflog -n 50
git log --oneline --graph --decorate -n 60 --all
git diff --stat && git diff --cached --stat
git log origin/main..HEAD --stat
git for-each-ref --format='%(refname) %(objectname) %(committerdate:iso)' refs/heads refs/remotes
Plus: open and merged PRs, CI runs with their tested SHAs, tags/releases, and the existence of each reference file listed in Section 3.4. None of these commands may modify the repository.
3.4 Reference artifacts to locate (SUPPLIED paths, existence NOT VERIFIED)
AGENTS.md · docs/MISSION_LEDGER.json · docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv · docs/SERVICE_CAPABILITY_MATRIX.md · docs/SERVICE_REGISTRY_EVIDENCE.md · docs/SERVICE_WORKSPACE_IMPLEMENTATION.csv · docs/SERVICE_WORKBENCH_ACCEPTANCE.md · docs/SERVICE_WORKBENCH_HOST_AUDIT.md · docs/handoffs/VISUAL_FIDELITY_CODEX_20261102.md · docs/evidence/living-glass-20261102/ · missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md · apps/gemini-ui/src/ · apps/gemini-ui/shared/native-contracts.ts
4. Preserved Unique Work
The following categories of work are protected. Codex must prove each is preserved (by SHA reachability from the final branch) before and after any integration.
Protected asset
Why
Class
2 local-only commits on local main
Not on remote; loss is unrecoverable if the disk fails or a reset occurs
SUPPLIED
5 modified tracked files in canonical checkout
Uncommitted visual/service work
SUPPLIED
codex/service-workspaces-20261101
Service workspace work
SUPPLIED
openhands/native-services-20261102 and OpenHands conversation worktrees
Native backend work
SUPPLIED
Previously verified organization execution + undo work and automation execution work
Ledger records fixture-tested organization functionality; automation work in earlier Codex branches
SUPPLIED
Living Glass headers, transparent artwork, orbital engine, docs/evidence/living-glass-20261102/
Approved product identity
SUPPLIED
REQUIRED protection procedure: before any branch operation, create a non-destructive safety net: (a) git bundle create of all refs to a location outside the repository, (b) an annotated tag preserve/<yyyymmdd>-<shortsha> on every unique tip, (c) a patch export of uncommitted changes via git diff and git diff --cached saved outside the working tree. No reset, clean, force-push, rebase of shared history, branch deletion or worktree removal is permitted.
5. Complete Product Architecture
5.1 Process model (DERIVED from the stated stack)
Renderer (React 18 + TS)  ──typed calls──▶  Preload (contextBridge, minimal surface)
        ▲                                          │ typed IPC (invoke + event channels)
        │ events (progress, state, receipts)       ▼
        └────────────────────────────  Electron Main
                                                │  validation → authorization → consent → coordinator
                                                ▼
                    Native providers (filesystem, registry, SCM, CIM/WMI, allowlisted processes, network, Google APIs)
                                                │
                         Journal / Receipt / Settings / Secret stores (restart-safe)
5.2 Layer responsibilities (REQUIRED)
Layer
Responsibility
Prohibited
Renderer
Presentation, local UI state, subscribing to events, invoking typed calls
Direct Node/filesystem/process access, holding secrets, deciding authorization
Preload
Narrow typed bridge; one function per contract; no generic invoke passthrough
Exposing ipcRenderer, wildcard channels
Main handlers
Schema validation, path canonicalization, scope + consent checks, capability gating
Trusting any renderer-supplied path, flag or approval
Operation coordinator
Session IDs, state machine, bounded concurrency, cancellation, idempotency, restart reconciliation
Unbounded parallelism, orphaned child processes
Providers
One narrow responsibility each; return typed results with provenance; never throw raw OS errors across the boundary
Shell string building, arbitrary command execution
Stores
Atomic, checksummed, schema-versioned persistence for journals, receipts, settings, secrets
Plaintext secrets, non-atomic writes
Whether the repository already implements these layers, and under which module names, is NOT VERIFIED. The rule for Codex: locate the existing module for each responsibility and extend it; introduce a new abstraction only when an inspection proves none exists, and record that proof.
5.3 Normalized result envelope (REQUIRED, backward-compatible extension)
Every service result and every live event normalizes to fields the UI can render without service-specific parsing: serviceId, sessionId, capabilityStatus, operationState, stage, progress {measured|null, basis}, scope, counts, latestEvent {seq, ts, message}, warnings[], errors[] {code, message, path?}, cancellable, provenance {provider, host, platform, sampleTime}, receiptRef. Existing field names in apps/gemini-ui/shared/native-contracts.ts (SUPPLIED path) win; extensions are additive. progress.measured = null means indeterminate; inventing a percentage is a defect.
5.4 Capability states (REQUIRED, shown honestly in the UI)
available · partial · unsupported-platform · provider-missing · needs-consent · needs-elevation · needs-credential · needs-windows-host · disabled-by-policy. Each carries a reason and remediation string. Controls for a non-available capability are disabled with that reason; they are never left as dead buttons and never simulate success.
6. Service Registry Reconciliation
6.1 Recorded breakdown (SUPPLIED)
Mission
Domain
Entries
01
Home Command Center
12
02
Smart Scan
10
03
Organization Studio
9
04
Google Workspace
10
05
Applications
12
06
Files
12
07
Storage
12
08
Cleanup
12
09
Startup
12
10
System / Network / Hardware
36 (12 + 12 + 12)
11
Repair Lab
12
12
Services Commander
12
13
Automation Flow Studio
12
14
Settings / Engine / AI
8

Total
181
Arithmetic check: 12+10+9+10+12+12+12+12+12+36+12+12+12+8 = 181. The count is consistent with the directive.
6.2 Reconciliation work for Codex (REQUIRED)
The count must never be silently altered. Codex builds a four-way reconciliation and records every difference with its cause:
1. Ledger rows in LIVE_SERVICE_EXECUTION_STATUS_181.csv (NOT VERIFIED).
2. Catalog IDs in the installed UI service registry.
3. Rendered workspaces actually mounted per service.
4. Native operation IDs actually exposed through preload/IPC.
Expected legitimate differences (DERIVED): one UI service may call several native operations; several services may share one provider; some entries are read-only views over another service's data; Clipboard Vault, global search, command palette, cinematic entry and integration tools may live outside the 181 (the directive mentions eight additional Clipboard Vault capabilities; they are documented separately and are not added to 181).
6.3 Spec reference IDs
The real catalog IDs are NOT VERIFIED, so this specification uses spec references of the form D<domain>.<nn> (for example D03.07). Codex adds a column mapping each spec reference to the true catalog ID and native operation ID during reconciliation. Spec references are never used in code.
7. 181-Service Master Inventory
Classification codes (DERIVED from the service names; each must be confirmed or corrected against the ledger):
• R read-only observation · P planning/preview (produces a plan, changes nothing) · A action (modifies system or user data) · I integration/navigation/aggregation over other services · X depends on an external provider, account or credential · S settings/preferences
• Risk: L low · M moderate (elevation, active probing, or reversible change) · H high (user data movement/deletion, system repair, protected configuration)
D01 — Home Command Center (12)
Ref
Service
Class
Provider family
Risk
D01.01
Smart Scan
I
Operation coordinator → D02
L
D01.02
Organize Files
I
Organization engine → D03
L
D01.03
Applications
I
App inventory → D05
L
D01.04
Storage
I
Volume provider → D07
L
D01.05
Cleanup
I
Cleanup engine → D08
L
D01.06
Startup Control
I
Startup provider → D09
L
D01.07
System Live Pulse
R
Performance counters / OS metrics
L
D01.08
Repair Lab
I
Repair engine → D11
L
D01.09
Global Search
R
Shared file index
L
D01.10
KNOuX Insight
P
Evidence-based recommendation engine
L
D01.11
Recent Activity
R
Journal / receipt store
L
D01.12
Pending Safe Actions
P
Consent / approval store
M
D02 — Smart Scan (10)
Ref
Service
Class
Provider family
Risk
D02.01
Quick Scan
R
Shared FS walker
L
D02.02
Deep Scan
R
FS walker + signature reader
L
D02.03
Duplicate Finder
R/P
FS walker + streaming hash
M
D02.04
Large Files
R
FS walker
L
D02.05
Junk Cleaner
P
Allowlisted junk locations
M
D02.06
Privacy Trace Check
R
Metadata-only artifact discovery
M
D02.07
Startup Impact
R
Registry / startup folders / tasks
L
D02.08
App Health
R
Registry + Appx inventory
L
D02.09
System Health Pulse
R
OS metrics sampler
L
D02.10
Smart Recommendations
P
Rule engine over measured findings
L
D03 — Organization Studio (9)
Ref
Service
Class
Provider family
Risk
D03.01
Sources
A (authorization only)
Scope manager + FS
M
D03.02
Visual Library
R
FS index + metadata/thumbnail readers
L
D03.03
Collections
P
Rule evaluator over index
L
D03.04
Organization Builder
P
Rule/destination editor + validator
L
D03.05
Destinations
P
Path validator
M
D03.06
Plan Review
P
Plan generator + collision detector
M
D03.07
Execution
A
Move/copy executor + verifier
H
D03.08
History & Undo
A
Journal + reverse executor
H
D03.09
Suggestions
P
Evidence-based suggestion engine
L
D04 — Google Workspace (10)
Ref
Service
Class
Provider family
Risk
D04.01
Google Sheets
X
Sheets API + OAuth
M
D04.02
Gmail
X
Gmail API + OAuth
H
D04.03
Google Tasks
X
Tasks API + OAuth
M
D04.04
Google Forms
X
Forms API + OAuth
M
D04.05
Google Contacts
X
People API + OAuth
H
D04.06
Google Calendar
X
Calendar API + OAuth
M
D04.07
Google Picker
X
Picker + OAuth
M
D04.08
Google Slides
X
Slides API + OAuth
M
D04.09
Google Chat
X
Chat API + Workspace account
M
D04.10
Google Classroom
X
Classroom API + eligible account
M
D05 — Applications (12)
Ref
Service
Class
Provider family
Risk
D05.01
Installed Applications Register
R
Registry uninstall keys + Appx/MSIX
L
D05.02
App Identity & Authenticode Trust
R
WinVerifyTrust / signature reader
L
D05.03
Multi-Parameter Software Search
R
Inventory index
L
D05.04
Publisher Intelligence & Reputation
R/X
Local signer data (+ optional external)
L
D05.05
Recently Changed Applications
R
Install-date / change tracking
L
D05.06
Bulk Uninstall Queue & Batch Manager
A
Native uninstaller / winget launch
H
D05.07
Orphaned Leftover Trace Analysis
R/P
FS + registry scan
M
D05.08
Software Update Center
A
winget upgrade
M
D05.09
Software Storage Footprint Treemap
R
FS size analysis
L
D05.10
Package Center & WinGet Browser
A
winget
M
D05.11
File Extension & Protocol Matrix
R
Registry associations
L
D05.12
Software Boot Impact Analyzer
R
Startup sources
L
D06 — Files (12)
Ref
Service
Class
Provider family
Risk
D06.01
Downloads Folder Inventory
R
FS index
L
D06.02
Visual Rule Builder & Organization Studio
P
Rule editor → D03
L
D06.03
Organization Staging & Change Review
P
Plan generator → D03
M
D06.04
File Organization Undo Timeline
A
Journal → D03.08
H
D06.05
Sparse Empty Folder Explorer
R/P
FS walker
L
D06.06
Cryptographic Hash Inspector
R
Streaming hash
L
D06.07
Instant Everything-Style File Search
R
Persistent in-memory index
L
D06.08
File Format Type Distribution
R
FS index
L
D06.09
Recent File Timeline Histogram
R
FS index
L
D06.10
Ranked Large File Explorer
R
FS index
L
D06.11
Deep File Metadata & Attributes Dossier
R
FS + NTFS attributes + streams
L
D06.12
Trust Evidence & Provenance Board
R
Zone.Identifier + signatures
L
D07 — Storage (12)
Ref
Service
Class
Provider family
Risk
D07.01
Volume Bays & Partition Manager
R
Volume/partition enumeration (read-only)
L
D07.02
Heavy-File Storage Ledger
R
FS index
L
D07.03
Byte-Exact Duplicate Hash Groups
R
Streaming hash + byte compare
M
D07.04
Interactive Storage Space Treemap
R
FS size analysis
L
D07.05
Folder Ranking Waterfall
R
FS size analysis
L
D07.06
Storage Byte Distribution by Category
R
FS index
L
D07.07
Drive Coverage & Scan Dashboard
R
Scan-session store
L
D07.08
Drive Optimization & TRIM Dossier
R
Storage CIM / defrag analysis (read)
L
D07.09
Disk Reliability & S.M.A.R.T. Health
R
Storage reliability counters (provider-limited)
M
D07.10
Storage Reclaim Planner & Basket
P
Plan builder → D08
M
D07.11
Capacity Trend Timeline
R
Stored real samples
L
D07.12
Removable USB & External Volume Dock
R
Volume enumeration + device events
L
D08 — Cleanup (12)
Ref
Service
Class
Provider family
Risk
D08.01
Temporary Files Candidate Safety Ledger
R/P
Allowlisted locations
M
D08.02
Quarantine Review & Safety Vault
A
Quarantine manager
H
D08.03
Cleanup Recovery Console & Journal
A
Journal + restore executor
H
D08.04
Quarantine Vault File Inspector
R
Quarantine manifest
L
D08.05
Space Savings Breakdown & Calculator
P
Measured sizes
L
D08.06
Recycle Bin Multi-Volume Inspector
R
Shell/Recycle Bin enumeration
L
D08.07
Dormancy & Unused Files Explorer
R
FS index (access/modify times)
L
D08.08
Windows Update & Servicing Cache Gateway
A
Servicing cache locations + allowlisted ops
H
D08.09
Web Browser Profile Cache Inspector
R
Metadata-only cache discovery
M
D08.10
Log Retention & Dump Explorer
R
FS index of log/dump locations
L
D08.11
Automated Cleanup Schedule Composer
P
Schedule model → D13
M
D08.12
Before/After Cleanup Report Studio
R
Receipts
L
D09 — Startup (12)
Ref
Service
Class
Provider family
Risk
D09.01
Windows Boot Autorun Register
R
Registry Run keys, startup folders, tasks
L
D09.02
Autorun State Change Preview
P
Change diff
L
D09.03
Startup Restoration & Rollback
A
Backup of prior state + restore
M
D09.04
Autorun Source Coverage Map
R
Source enumerators
L
D09.05
Startup Change Audit Journal
R
Journal store
L
D09.06
Keyboard-First Autorun Query Console
R
Autorun register
L
D09.07
Boot Sequence Impact Timeline
R
Measured boot/diagnostic events only
M
D09.08
Service Boot Policy Matrix
R
SCM
L
D09.09
Logon Scheduled Task Timeline
R
Task Scheduler enumeration
L
D09.10
Delayed Launch Planner
P
Plan model (+ optional scheduled task)
M
D09.11
Autorun Batch Staging Tray
P
Staged changes
M
D09.12
Batch Recovery & Mass Rollback Workspace
A
Journal + restore
H
D10 — System / Network / Hardware (36)
System services (12)
Ref
Service
Class
Provider family
Risk
D10.01
System Pulse Overview Console
R
OS metrics sampler
L
D10.02
Windows Event Log Severity Ledger
R
Event Log API (read)
L
D10.03
Active Process Register & Resources
R
Process enumeration + counters
L
D10.04
System Binary Certificate Inspector
R
WinVerifyTrust / catalog signatures
L
D10.05
System Boot & Session Clock Timeline
R
Uptime + session events
L
D10.06
Live Performance Pulse Charts
R
Timestamped counter samples
L
D10.07
Device Driver Inventory & Signatures
R
PnP/driver CIM + signatures
L
D10.08
Event Log Channel Explorer
R
Event channel enumeration
L
D10.09
Top Resource Consuming Processes
R
Process counters
L
D10.10
App-to-Process Cross-Service Links
I
Links D05 ↔ D10.03
L
D10.11
System Service Dependency Graph
R
SCM dependencies
L
D10.12
Unified System Event Timeline
R
Event Log + journal merge
L
Network services (12)
Ref
Service
Class
Provider family
Risk
D10.13
Network Interfaces Console
R
Adapter enumeration
L
D10.14
DNS Resolver Configuration Dossier
R
DNS client configuration
L
D10.15
Network Hardware Atlas & NIC Rack
R
NIC CIM
L
D10.16
Connectivity Diagnostic Step Sequence
R (active probe)
Allowlisted probes
M
D10.17
Real-Time Traffic & Throughput Chart
R
Interface byte counters
L
D10.18
Hop Route & Latency Visualizer
R (active probe)
Allowlisted trace
M
D10.19
LAN Topology & Node Relationship Map
R (limited)
ARP/neighbor table (partial by nature)
M
D10.20
Active Socket & Port Explorer
R
TCP/UDP table + owning process
L
D10.21
Wireless Wi-Fi Status & Signal Instrument
R
WLAN API (hardware-dependent)
L
D10.22
Windows Hosts File Inspector
R
Hosts file read
L
D10.23
Proxy & WinHTTP Configuration Graph
R
WinHTTP/WinINET settings
L
D10.24
Network Recovery & Reset Gateway
A
Allowlisted reset ops → D11
H
Hardware services (12)
Ref
Service
Class
Provider family
Risk
D10.25
Device Hardware Atlas & Components
R
CIM/SMBIOS
L
D10.26
Battery Charge & Health Instrument
R
Battery API (if present)
L
D10.27
Processor Architecture & Core Die
R
CPU CIM
L
D10.28
Graphics Adapter Bay & VRAM
R
Display adapter CIM/DXGI
L
D10.29
DIMM RAM Slots & Memory Layout
R
Physical memory CIM
L
D10.30
Battery Wear & Cycle Count Ledger
R
Battery report (if exposed)
L
D10.31
Thermal Sensors & Temperature Board
R
Thermal zones (often unsupported)
L
D10.32
Physical Disk Drives & Bus Interface
R
Disk CIM
L
D10.33
USB Controller & Device Topology Tree
R
PnP enumeration
L
D10.34
Monitor Topology & Resolution Canvas
R
Display configuration
L
D10.35
Audio Endpoint Mixer & Devices
R
Audio endpoint enumeration
L
D10.36
Hardware Evidence & Diagnostic Report
R
Report from D10.25–35
L
D11 — Repair Lab (12)
Ref
Service
Class
Provider family
Risk
D11.01
DISM CheckHealth Diagnostic Console
R
Allowlisted DISM
M
D11.02
DISM ScanHealth 7-Stage Console
A
Allowlisted DISM (elevation)
M
D11.03
DISM RestoreHealth System Repair Wizard
A
Allowlisted DISM (elevation)
H
D11.04
SFC VerifyOnly File Integrity Shield
A (read-only mode)
Allowlisted SFC
M
D11.05
SFC ScanNow Protected File Repair Wizard
A
Allowlisted SFC (elevation)
H
D11.06
DNS Resolver Cache Refresh Preview
P
DNS cache read + flush preview
L
D11.07
Winsock Catalog Disruption Risk Review
P
Winsock catalog read
M
D11.08
TCP/IP Stack Reset Configuration Diff
P
IP configuration read + diff
M
D11.09
System Repair Audit Journal
R
Journal store
L
D11.10
Windows Troubleshooter Gateway
A
Built-in troubleshooter launch
M
D11.11
System Restore Point Inspector
R
Restore point enumeration
L
D11.12
Windows Update Servicing Reset Wizard
A
Allowlisted service/cache steps
H
D12 — Services Commander (12)
Ref
Service
Class
Provider family
Risk
D12.01
Windows SCM Service Register
R
SCM enumeration
L
D12.02
Service State Change Review & Guard
A
SCM control (consent-gated)
H
D12.03
Service Startup Policy Undo Journal
A
Journal + SCM restore
H
D12.04
Interactive Service Dependency Network
R
SCM dependencies
L
D12.05
Protected Windows Core Services Atlas
R
Protected-service catalog
L
D12.06
SCM Keyboard-First Query Console
R
Service register
L
D12.07
Startup Policy Distribution Analytics
R
SCM
L
D12.08
Service Transition State History
R
Stored state samples + events
L
D12.09
Cascade Service Dependency Impact Tree
R/P
Dependency graph
L
D12.10
SCM Fault Investigation & Diagnostics
R
Service events + failure actions
L
D12.11
Startup Policy Configuration Diff
P
Policy diff
L
D12.12
Shared-Process svchost.exe Monitor
R
Process ↔ service map
L
D13 — Automation Flow Studio (12)
Ref
Service
Class
Provider family
Risk
D13.01
Smart Scan Automated Workflow Flow
A
Workflow engine → D02
M
D13.02
Weekly Automation Calendar & Task Manager
P/A
Scheduler + persistence
M
D13.03
Automation Run History Timeline
R
Run journal
L
D13.04
Workflow Template Gallery & Library
R
Template store
L
D13.05
Recurrence Composer & Cron Preview
P
Recurrence engine (timezone/DST aware)
L
D13.06
Safe Automated Cleanup Pipeline
A
Workflow engine → D08
H
D13.07
Notification Channel Routing Board
A
Notification router
L
D13.08
Quiet Hours 24-Hour Dial
P/S
Scheduler policy
L
D13.09
Power-Aware Scheduler & Battery Gating
P/A
Power state API
L
D13.10
Artifact Retention Policy Timeline
A
Retention executor over receipts/reports
M
D13.11
Workflow Export & Schema Transfer
A
Schema export/import (validated)
M
D13.12
Backup Flow & Verification Designer
A
Backup executor + verifier
H
D14 — Settings / Engine / AI (8)
Ref
Service
Class
Provider family
Risk
D14.01
Engine & Turbo Hardware
S
Engine settings → real concurrency limits only if wired
M
D14.02
AI Copilot & Provider Keys
X
Provider abstraction + secret store
M
D14.03
Google Workspace Hub
X
OAuth manager → D04
M
D14.04
Automated Protection & Guards
S
Guard policy store
M
D14.05
Neon Glass Customization
S
UI preference store
L
D14.06
Language & Locale
S
i18n + RTL/LTR
L
D14.07
Profile Backup & System Restore
A
Settings export/import
M
D14.08
AI Assistant Chat
X/I
Provider + allowlisted service routing
M
7.1 Inventory totals (REQUIRED to reconcile)
Domain
Rows above
Registered
D01
12
12
D02
10
10
D03
9
9
D04
10
10
D05
12
12
D06
12
12
D07
12
12
D08
12
12
D09
12
12
D10
36
36
D11
12
12
D12
12
12
D13
12
12
D14
8
8
Total
181
181
The classes, providers and risks above are DERIVED from service names and are hypotheses until checked against the ledger. A row whose real class differs is corrected in Vol. 6, with the evidence.
8. Current Implementation Reality and the Per-Service Contract Template
8.1 What is known about current implementation
From SUPPLIED evidence only: the product has an established Living Glass visual system; compact service selectors and specialized workspaces are in progress (codex/service-workspaces-20261101); native-service work is in progress on OpenHands branches; the ledger records fixture-tested organization execution and undo functionality; verified automation execution work exists on earlier Codex branches. Everything else about current implementation is NOT VERIFIED. Codex must not infer that a service works because a component, hook or provider file exists, and must not infer that it is missing because this document lists it.
8.2 Evidence-backed status vocabulary (REQUIRED)
Implemented and runtime verified · Implemented and fixture tested · Partially implemented · Read-only by intended design · Preview-only despite requiring execution · Gated by user consent · Gated by privileges · Blocked by external provider · Exists but not integrated · Exists in another unmerged branch · Not implemented · Not verified.
A deliberately read-only observation service that observes accurately is Read-only by intended design, not incomplete.
8.2.1 Two different questions, and they must never be merged into one column (owner correction item 2)
A single status word is ambiguous, so every status in this package is now written as a pair:
Question
Field
Values
Who may change it
HISTORICAL CLASSIFICATION — what the dated records asserted
matrix_181_v2.csv columns `historical_status`, `historical_slice_status`, `historical_implementation_sha`, `historical_sha_reachability`, `historical_evidence_path`
the vocabulary in 8.2, copied from the ledger, never rewritten here
only a completed revalidation, with a citation
CURRENT RUNTIME VERIFICATION — what has been proven against this baseline
matrix_181_v2.csv column `current_runtime_verification`
NOT RUN, FIXTURE PASSED at <sha>, ELECTRON RUN at <sha>, PACKAGED RUN at <sha>, OWNER-DATA RUN at <sha>
only an executed command with a recorded exit code and SHA
The measured split at the time of writing is 24 of 181 entries assessed in the newest ledger slice and **157 carrying `NOT_REASSESSED_IN_THIS_SLICE`**. All 157 are flagged `MANDATORY SOURCE REVALIDATION`; the 24 are flagged `CONFIRM NOT REGRESSED`.
Three rules follow, and they bind Codex:
1. A revalidation may raise, hold or lower a classification, and must cite what it read. Downgrading a previously verified service without new evidence is a reporting error: it destroys information the owner paid for.
2. Revalidation is cheap and read-only for the 24: the recorded implementation SHAs were tested for reachability from the current tip in this pass and all of them are ancestors of current `main`, so the work is present in history. Confirming it still behaves the same is a test run, not an archaeology task.
3. Revalidation of the 157 is a per-domain task, ordered by Matrix/revalidation_queue.md, and its output goes into the matrix, not into a new prose document.
8.3 The 15 questions asked of every service (REQUIRED)
1. What exists today, and where (file path and symbol)?
2. Does it use real data?
3. Does it have an action executor?
4. Does it need one?
5. Is the UI connected through preload and typed IPC?
6. Does workflow state persist across restart?
7. Is cancellation genuine (stops the walker or child process)?
8. Is the result verifiable against the system after the fact?
9. Can the user recover from errors?
10. Fixture tested?
11. Tested in real Electron?
12. Tested in a packaged Windows build?
13. Verified on authorized owner data (with consent)?
14. What specifically remains?
15. Which branch holds unmerged work for it?
8.4 Gap classes (a gap must name at least one, plus affected paths and the acceptance test that proves it closed)
Missing native provider · action executor · IPC contract · consent boundary · persistence · progress events · cancellation · error handling · undo/recovery · result inspector · live UI binding · visual fidelity · integration · automated test · real Windows runtime proof · packaged acceptance · external account authorization · documented platform limitation.
No gap is invented. A gap without evidence is written as HYPOTHESIS — resolve by <inspection>.
8.5 Mandatory 12-part contract for every service (Volumes 2–5 repeat this for all remaining entries)
Part
Content
A. Identity
Spec ref, catalog ID, name, domain/route, classification, relationships
B. User objective
Problem solved, visible outcome, how opened
C. Existing implementation
Components, hooks, preload, IPC channels, provider, persistence, symbols (NOT VERIFIED until read)
D. Evidence status
One value from 8.2
E. Exact missing work
Only what inspection established
F. Backend contract
Input, output, validation, provider behavior, progress, cancellation, errors, persistence, provenance
G. Frontend contract
Workspace structure, controls, states, results, inspector, accessible interaction, live preview
H. Lifecycle
Applicable stages of Discover → Configure → Preview → Authorize → Execute → Verify → Record → Recover
I. Safety
Read-only vs scope vs elevation vs data-modifying
J. Error and recovery
Cancel, retry, partial failure, restart, corrupt input, inaccessible resource
K. Acceptance tests
Fixtures, invalid cases, permission failure, cancellation, postconditions, UI checks
L. Delivery proof
Code paths, SHA, test output, runtime evidence, limitations
8.6 Workspace UI states (REQUIRED for every service)
Not initialized · No authorized source · Provider unavailable · Ready · Configuring · Processing · Partial · Completed · Cancelled · Failed · Awaiting consent · Awaiting elevation · Recovery available. Each state has a distinct, truthful presentation. No fake percentages, no fictional live activity, no demo numbers shown as measurements, no oversized empty result area, no generic workbench reused without domain specialization.
9. Domain 03 — Organization Studio (9 entries, highest priority)
Organization Studio is the reason KNOuX exists and the domain with the highest data-loss risk. The ledger records fixture-tested organization execution and undo. Codex's first task here is to locate and characterize that work (SUPPLIED claim; code NOT VERIFIED), then close only the gaps that inspection proves.
9.1 End-to-end journey (REQUIRED user-visible behavior)
1. The user authorizes one or more folders (Sources).
2. The engine inventories real files and the Visual Library shows them by category with real names, icons, counts and sizes.
3. Collections group files by rule or by folder.
4. The Organization Builder lets the user order rules and choose destinations (Destinations).
5. Plan Review shows every proposed source → destination, collisions, exclusions and totals.
6. The user approves the exact plan; Execution performs only those operations with live, measured progress.
7. The result is verified and recorded; History & Undo can reverse supported operations.
8. Suggestions propose rules from measured inventory evidence.
9.2 Core data model (REQUIRED; extend existing types in native-contracts.ts rather than duplicating)
Entity
Required fields
AuthorizedSource
id, canonical path, volume ID, granted-at, recursive flag, exclusions[], status (active, revoked, missing)
InventoryItem
stable file identity (volume serial + file ID where available), canonical path, name, extension, size, created/modified/accessed, attributes (hidden/system/readonly/reparse), category, category-rule trace, optional dimensions/duration
Rule
id, order, match (extension set, name pattern, size/date bounds, category, source), destination template, collision strategy, enabled
PlanItem
itemRef, source path, destination path, operation (move/copy), same-volume flag, predicted collision, rule trace, status
Plan
planId, plan hash (over normalized items + options), items[], excluded[] with reasons, totals, created-at
ApprovalToken
bound to planHash, single use, expiry; invalid if any item changes
OperationRecord
per item: pre-state, post-state, method, hash (when cross-volume), result, error code, timestamp
Receipt
receiptId, planId, per-item records, summary counts, verification outcome, schema version, checksum
9.3 Non-negotiable engine rules (REQUIRED)
• Authorization: Main resolves each path to its canonical form (real path, case-normalized, no .., no 8.3 short-name tricks) and requires it to sit under an active authorized source. Renderer-supplied paths are never trusted.
• Protected locations: the Windows directory, Program Files trees, the user profile's system folders (AppData internals), credential and browser-secret stores, and the application's own data directory are never valid sources or destinations unless the user explicitly authorizes a specific subfolder outside those protections.
• Reparse points: symlinks and junctions are never followed outside the authorized source; a reparse point is listed as such and excluded from moves by default. A traversal cycle guard is mandatory.
• Collision detection: case-insensitive comparison; reserved device names (CON, PRN, AUX, NUL, COM1–9, LPT1–9); trailing dots/spaces; invalid characters; path length (long-path aware); duplicate destinations created by two plan items; destination equal to source (no-op). Strategies: skip, rename with numeric suffix, keep both with source tag. Silent overwrite is not a strategy.
• Same volume: use an atomic rename/move. Cross volume: copy → flush → verify (size, then hash) → only then remove the source; on any verification failure the source is untouched and the partial destination is removed and recorded.
• Atomicity limits (documented to the user): a batch is not atomic; each item is. Interruption leaves a consistent per-item record.
• File locks and permissions: a locked or denied file is recorded as FILE_LOCKED or PERMISSION_DENIED, skipped, and the batch continues.
• Bounded work: capped concurrency, throttled progress events, streaming hashes, no whole-tree arrays held for very large sources (paged inventory).
• Journal before effect: the intent for each item is persisted before the file operation; the outcome is persisted after. Restart reconciles any item with intent but no outcome by inspecting the filesystem and recording what is true.
• Never delete owner data as part of organization. Removal of a source file occurs only as the verified final step of a cross-volume move.
9.4 Undo semantics (REQUIRED)
Undo applies per receipt and per item. It reverses a move only if the file at the destination still matches the recorded post-state (identity, size, and hash when recorded) and the original source path is free or collision-resolved by the same strategies. Items that changed since execution are reported as NOT_UNDOABLE with the reason; they are never forced. Undo itself produces a receipt and can be partially complete. Undo of a cross-volume move reverses via the same copy-verify-remove sequence. Empty folders created by execution may be removed only if the receipt shows KNOuX created them and they are still empty.
9.5 Per-service contracts
For each service below, parts C (existing implementation), D (evidence status) and L (delivery proof) are NOT VERIFIED until Codex inspects the repository; catalog IDs and symbols are filled in during reconciliation (Section 6.2). Parts A, B, E–K are the REQUIRED contract.
D03.01 — Sources
• Objective: let the user grant and revoke the folders KNOuX may read and organize. Opened from Organization Studio entry, Home, and Files.
• Missing-work test: confirm whether a persistent scope store with canonical paths and revocation exists; if not, build it on the shared Authorization & Scope manager.
• Backend: authorizeSource(path, {recursive, exclusions}) → validates existence, canonicalizes, rejects protected locations, records volume ID and removable/network status; revokeSource(id); listSources(). Revoking a source cancels running sessions on it and marks plans that reference it stale.
• Frontend: folder picker via the main-process dialog (never a typed path trusted blindly); source cards with real path, volume, last scan time and item count; exclusion editor; states for missing (drive unplugged), revoked, and permission-denied.
• Lifecycle: Configure → Authorize → Record. No effect on files.
• Safety: read-only toward files; the authorization record itself is journaled.
• Errors: path vanishes → missing, not deleted from the list; network path unreachable → honest state; duplicate or nested source → merged with a visible note.
• Acceptance: fixture: authorize C:\fixture\a, then C:\fixture\a\b (nested → merged note); authorize a protected path (rejected with UNAUTHORIZED_SCOPE); authorize then delete the folder externally (shows missing); restart app (sources persist); revoke during scan (scan cancels, plan marked stale).
D03.02 — Visual Library
• Objective: a visual, real inventory of authorized sources: categories with real filenames, icons, counts and sizes.
• Missing-work test: verify the inventory comes from real traversal (not seeded arrays) and supports paging, filters and large trees.
• Backend: inventoryStart(sourceIds, options) → session; paged inventoryPage(sessionId, cursor, filters); events with measured scanned count (total unknown → progress.measured = null). Category classification from extension plus signature sniffing for ambiguous types; image dimensions and media duration only from real metadata reads (failure → field absent, never zero). Thumbnails generated lazily, cached, size-bounded, and only for files inside authorized scope.
• Frontend: category cards (documents, images, video, audio, archives, code, applications, other) with counts/sizes from the session; virtualized file grid and list; filter by category, size, date, extension; file inspector with path, size, timestamps, attributes, rule trace, reveal-in-Explorer through validated IPC. Empty state when no source is authorized; partial-results state when traversal hit access errors, listing them.
• Safety: read-only; unreadable files recorded, not hidden.
• Acceptance: fixture tree with Unicode names, 260+ character paths, junction loop, locked file, zero-byte file, 10k small files; assert counts equal ground truth, junction not followed, error list contains the locked file, cancellation stops traversal within a bounded time, second run is consistent.
D03.03 — Collections
• Objective: named groupings (by rule match or by folder) the user can inspect before building a plan.
• Backend: evaluateCollection(rule | folder, sessionId) → matching item references and totals, computed on the shared index; collections persist as rule definitions, not as file copies.
• Frontend: collection list with live match counts; click-through into the library filtered by that collection; overlap indicator when one file matches several collections.
• Safety: read-only. Acceptance: rule *.jpg over a fixture returns exactly the fixture's JPEGs; overlap reported; deleting a file externally and refreshing updates counts.
D03.04 — Organization Builder
• Objective: author ordered rules and destination templates, with immediate preview of matches.
• Backend: rule schema validation (VALIDATION errors with field paths); deterministic first-match-wins ordering with an explicit rule trace per file; destination templates support a fixed set of tokens (category, extension, year, month, source folder name) validated against Windows path rules; rule import/export validated and size-limited.
• Frontend: drag-reorder rules, per-rule match count, a file-level "why did this match" trace, invalid-destination warnings before the plan stage.
• Safety: builds no operations. Acceptance: conflicting rules produce a deterministic order; a template yielding a reserved name or over-long path is rejected at edit time; invalid imported JSON is rejected without partial application; rule order survives restart.
D03.05 — Destinations
• Objective: choose and validate where organized files go.
• Backend: validateDestination(path) → exists/creatable, writable, volume, free space vs planned bytes (real free from the volume, never estimated), same-volume relation to each source, protected-location check, case-collision and reserved-name checks, network/removable warnings. Creating folders is deferred to execution and journaled; validation never creates anything.
• Frontend: destination cards showing real free space and the planned bytes routed there; a clear warning when a plan exceeds free space (execution is blocked, not attempted).
• Acceptance: destination inside a source (loop risk) is flagged; destination on a read-only fixture fails with PERMISSION_DENIED; insufficient space blocks approval; removable volume unplugged mid-edit shows missing.
D03.06 — Plan Review
• Objective: a complete, honest preview of what will happen, before anything happens.
• Backend: buildPlan(sessionId, rules, destinations, options) → Plan with planHash; every item carries its rule trace and predicted collision. dryRun(planId) runs the same code path as execution up to, but excluding, the file operation, and returns predicted per-item outcomes. Approval: approvePlan(planId, planHash) issues a single-use ApprovalToken bound to the hash; any plan change, source change detected by identity/size/mtime recheck, or elapsed expiry invalidates it.
• Frontend: source → destination table with filtering by rule, collision, category; totals by operation and bytes; excluded items listed with reasons; explicit approve button disabled until the dry-run has completed on the current hash; staleness banner if the filesystem changed since plan time.
• Safety: no filesystem mutation. Acceptance: plan hash changes when a single rule changes; token from plan A rejected for plan B; modifying a source file after planning triggers staleness; dry-run predictions equal real execution outcomes in a disposable tree.
D03.07 — Execution
• Objective: perform exactly the approved plan, observably and safely.
• Backend: executePlan(planId, approvalToken) validates token, re-authorizes every path in Main, then runs items with bounded concurrency (default conservative; same-volume renames may run wider than cross-volume copies). Per item: re-verify source identity → write intent record → operate → verify (existence, size; hash for cross-volume) → write outcome. Events carry completed, total, bytesDone, current, last error. Cancellation stops dispatching new items, lets in-flight items finish or roll back their partial destination, and records CANCELLED with exact counts. A pause is not required; cancellation and restart recovery are.
• Frontend: live progress from real counts (measured), per-item results stream, running error list, cancel button available throughout, no fabricated percentage when total is unknown. Completion shows verified counts: moved, skipped, collisions resolved, failed, with a link to the receipt.
• Safety: H. Requires a valid approval token; never runs without a dry-run on the same hash; never overwrites; destination folders created only under approved destination roots.
• Errors: source vanished (NOT_FOUND, skipped), destination appeared since planning (collision strategy re-applied, never overwrite), disk full mid-batch (stop, record, leave consistent), process crash (recovery scan on next launch).
• Acceptance (disposable tree only): (1) 500 mixed files, same volume → all moved, byte-identical via hash, receipt count matches; (2) cross-volume simulation (second fixture volume or VHD where available; otherwise a copy-verify path test with an injected volume boundary) → source removed only after hash match; (3) induced hash mismatch → source preserved, destination removed, item FAILED; (4) cancel at 40% → exactly the completed items are recorded, none half-written; (5) kill the process mid-batch, relaunch → reconciliation yields a truthful receipt; (6) locked file skipped, batch continues; (7) name collision with each strategy; (8) no file outside authorized roots modified (before/after tree manifest diff).
D03.08 — History & Undo
• Objective: see what KNOuX did and reverse it where possible.
• Backend: listReceipts(filters), getReceipt(id), previewUndo(receiptId, itemIds?) (computes per-item feasibility without acting), undo(receiptId, itemIds?, consent); undo semantics per Section 9.4; receipts are append-only, checksummed, schema-versioned, and survive upgrades. Retention is policy-driven and never deletes a receipt whose undo is still feasible without explicit user action.
• Frontend: timeline of operations with real timestamps, counts and outcomes; per-item undo status (UNDOABLE, NOT_UNDOABLE + reason, UNDONE); undo preview before confirmation; partial-undo result presentation.
• Safety: H; consent token required; never forces a reverse over changed data.
• Acceptance: execute → undo restores the original tree manifest exactly; modify a moved file → that item reported NOT_UNDOABLE, others undone; undo twice → idempotent; corrupt receipt file → detected by checksum, reported, not trusted; receipt survives restart and app upgrade fixture.
D03.09 — Suggestions
• Objective: propose useful rules from measured evidence (for example a Downloads folder where 60% of bytes are installers), never from invention.
• Backend: deterministic analyzers over the inventory session produce suggestions {evidence {counts, bytes, examples[]}, proposedRule, expectedEffect (computed from the real inventory), confidence basis}. Any model-assisted wording is optional and never changes the measured numbers or creates actions; applying a suggestion only pre-fills the Builder.
• Frontend: suggestion cards with the actual example filenames and numbers; an apply action that opens the Builder with the rule drafted; dismissal persisted.
• Safety: proposes only. Acceptance: a fixture with a known distribution yields exactly the expected suggestion and numbers; an empty inventory yields none and says so; applying a suggestion changes no files.
9.6 Domain 03 cross-domain handoffs (REQUIRED)
From
To
Transfer
Rule
D06.07 Search result
D03.03 Collection / D03.06 Plan
Selected item references (identity + path)
Re-validated in Main; stale references dropped with a note
D02.03 Duplicate group
D08 Cleanup preview
Group IDs + keep-recommendation
Never auto-selects deletion
D03.07 Receipt
D03.08 History, D01.11 Recent Activity
receiptRef
Read-only link
D13 Automation
D03.07 Execution
Preapproved, plan-hash-bound token
Stale hash ⇒ run is skipped and logged, not executed
D03.09 Suggestion
D03.04 Builder
Draft rule
Pre-fill only
9.7 Domain 03 completion criteria
CORRECTED 2026-11-03: the original sentence applied one packaged execute-and-undo gate to all nine services, which is impossible for the four whose registered class is A (D03.01 Sources, D03.02 Visual Library, D03.03 Collections, D03.09 Suggestions) — they perform no mutation, so demanding a packaged undo cycle from them either forces a fake test or leaves them permanently "incomplete". The gate is now stated per class. Every clause that applied before still applies to the services it can apply to; nothing was weakened.
Class A services (D03.01, D03.02, D03.03, D03.09) are complete when: their acceptance tests pass at fixture level against ground-truth trees; every displayed number is provider-measured and every unmeasurable field is shown as unavailable with a reason; long paths, junction loops, locked files, Unicode names and case-insensitivity are exercised in the traversal tests; and no log, screenshot or UI state presents fixture data as owner data. A packaged execute/undo cycle is **not** a condition for these four and must not be written as outstanding on a status report.
Class B services (D03.04 Organization Builder, D03.05 Destinations, D03.06 Plan Review, D03.07 Execution, D03.08 History and Undo) are complete when, in addition to the above: execution and undo have been exercised in a real Electron session against a disposable tree; Windows-native behavior is verified on a Windows host; the packaged build performs a full organize → verify → undo cycle; and the plan-hash approval cannot be bypassed by a crafted renderer call.
Domain-level product claim: Domain 03 may be reported as a complete domain only when every class B service has cleared its packaged cycle **and** every class A service has cleared its own bar, with each layer's SHA recorded separately. Reporting the domain as complete because the read services pass, or as incomplete because a read service has no packaged undo test, is equally wrong.
Domain-level product claim: Domain 03 may be reported as a complete domain only when every class B service has cleared its packaged cycle **and** every class A service has cleared its own bar, with each layer's SHA recorded separately. Reporting the domain as complete because the read services pass, or as incomplete because a read service has no packaged undo test, is equally wrong.
10. Acceptance and Evidence Framework
10.1 Verification layers (a later layer is never inferred from an earlier one)
#
Layer
What it proves
Evidence to record
1
Unit
Pure logic (classification, rule order, collision detection, plan hashing)
Command, exit code, pass/fail/skip counts
2
Contract
Renderer ↔ preload ↔ IPC types and schemas agree; backward compatibility of extended fields
Contract test output, schema diff against baseline
3
Integration
Main handlers + providers + stores together on fixtures
Fixture manifest before/after
4
Electron
Real Electron run drives the real UI to real Main handlers
Run log, screenshots, journal excerpt
5
Windows native
Behavior that only Windows provides (long paths, junctions, locks, registry, SCM, case-insensitivity)
Host description, command output, postcondition check
6
Packaged product
The installer/portable build performs the flows
Package hash, install log, run log
7
Release
Signed artifact, update path, migration from a prior profile
Signature verification, upgrade test log
Fixture and simulated-provider tests are labeled as such in every report. Passing layer N never marks layer N+1 passed.
10.2 Evidence record (REQUIRED for every verified claim)
service spec ref · exact command · exit code · test counts · tested commit SHA · environment (OS build, Electron version, privilege level, fixture vs real device) · evidence file path · remaining limitations. A claim without these is recorded as unverified.
10.3 Test categories required per service
Valid input · invalid input · missing provider · unauthorized scope · partial failure · cancellation · result correctness against independent ground truth · error classification · journal integrity · restart recovery (where state persists) · renderer-contract compatibility · dead-control check (every control either works or is gated with a truthful reason).
10.4 UI verification matrix (REQUIRED for every mounted workspace)
Day and Night · English and Arabic · RTL and LTR · 1366×768, 1672×941, 1920×1080 · keyboard-only operation and visible focus · screen-reader names/roles for controls and live regions · reduced-motion behavior · hit-target size · scrolling reaches the final row · no clipping or overlap · fidelity to the approved reference. Visual acceptance remains Codex's stream; this framework only requires that data states render truthfully inside it.
10.5 Native safety rules for tests
• Operations that modify files, registry, services, startup entries, network configuration or system components run only against disposable fixtures, simulated providers, or an isolated Windows VM. Never against the owner's real data or system without explicit, operation-specific consent recorded in the evidence.
• Privileged repair operations (DISM RestoreHealth, SFC ScanNow, Winsock/TCP/IP reset, Windows Update reset) are verified through simulated runners plus read-only diagnostics on real hosts; a real execution requires explicit authorization and is labeled in the evidence.
• A before/after manifest diff proves no unrelated mutation.
11. Git, Branch and Worktree Integration Procedure
The proposed execution branch is codex/knoux-all-services-execution-20261102. It is a proposal; Codex first checks whether an existing branch or worktree already serves the mission.
1. Observe, do not touch. Run Section 3.3. Record the output verbatim. Do not switch branches in a dirty checkout.
2. Preserve. Create the bundle, tags and patch exports from Section 4 outside the repository. Commit or checkpoint verified owned work on its existing branch where authorized; otherwise keep it as patch files.
3. Choose a base. The base is the latest verified integrated state that contains all preserved visual and native work Codex is entitled to include, not a blindly fetched older remote main. If local main holds two unpushed commits, they are part of the base candidates; decide by reachability and tested SHA, and write the decision in the evidence.
   CORRECTED 2026-11-03 with measured numbers: local `main` held **seven** unpushed commits (`0 7` against `origin/main`) when this correction was published — it held five at the start of the same session and six midway, because another agent commits to this checkout while documents are being read. "Two" was a stale observation; choosing a base from it picks the wrong commit. Re-measure with `git rev-list --left-right --count origin/main...main` at the moment you choose, never from this sentence, and record the output verbatim in your handover.
4. Isolate. Create the execution branch in a separate git worktree so the canonical dirty checkout, other agents' worktrees and OpenHands conversation worktrees are never disturbed.
5. Bring in other work deliberately. For each of codex/service-workspaces-20261101, openhands/native-services-20261102 and any historical donor branch: inspect git log base..branch, review the diff, check ownership boundaries, check overlap with Codex-owned visual files, and integrate by reviewed merge or cherry-pick of specific commits. No automatic merging of OpenHands or historical branches. Conflicts are resolved by preserving both sides' intent and re-running tests, never by discarding the other agent's work.
   MEASURED 2026-11-03, so this list is not worked blindly: `git rev-list --count main..<branch>` returned **0** for `codex/service-workspaces-20261101`, **0** for `openhands/native-services-20261102` and **0** for `origin/feat/gemini-missions`. Those three are already fully contained in local `main`; re-merging them would create noise, not recover work. The one branch that still holds unique commits is `origin/v0/knoux-smartorganizer-integration-b432675e` with **6** commits not in `main` (`d2c4b89`, `6856007`, `f00f661`, `c7e9fec`, `f815c4b`, `c01638d` — the Home/Files/Studio pastel-glass reference rebuilds and the settings provider-state work, which is PR #4). Treat that branch as the only live donor, and re-run the counts yourself before touching anything: the answer changes as other agents work.
6. Shared native contracts. Changes to native-contracts.ts are additive and backward compatible; any breaking change requires a version bump, a compatibility shim and a contract test.
7. Commit discipline. Small, verified, owned commits (feat(<domain>), fix(<domain>), test(<domain>), wire(<domain>)), each with the evidence record. Review git diff before each commit; confirm no secrets, no local data, no unrelated files.
8. Pre-integration verification. Type-check, lint, build, unit/contract/integration suites, Electron smoke, on the exact SHA to be proposed.
9. Never merge into protected main without reviewing the actual change set and required approvals. Open a pull request or provide a comparison URL; do not force-push, rewrite shared history, delete branches or remove worktrees.
10. Post-merge regression. After any approved integration, re-run the full suite on the merged SHA and re-verify the protected assets in Section 4 are reachable.
11.1 Handling specific situations
Situation
Required handling
Local-only commits
Tag + bundle first; push to a distinct branch only if authorized
Uncommitted visual changes
Patch export; commit on the owning branch only by their owner or with authorization
OpenHands backend branches
Inspect and review; integrate selected verified commits; document each
Historical donor branches
Mine for verified work only; do not revive unverified code
Open PRs
Read before duplicating; coordinate by referencing, not overwriting
Concurrent agents
Re-run git worktree list and git fetch before each integration step
Conflicting shared contracts
Additive resolution + contract test; escalate in the handover if irreconcilable
12. Security and Consent Baseline (applies to every domain)
Threat
Required control
Path traversal, 8.3 short names, \\?\ and UNC surprises, alternate data streams
Canonicalize in Main, compare under authorized root after resolution, reject device paths and ADS unless a service explicitly reads them
Symlink / junction escape and TOCTOU
Never follow reparse points outside scope; re-verify file identity immediately before every mutating operation; operate by handle where the platform allows
Command injection
Process runner accepts only allowlisted executables with typed arguments; no shell, no string concatenation, no renderer-supplied command text
Privilege boundaries
Detect elevation; never self-escalate silently; elevated work runs through a minimal allowlisted path; report needs-elevation honestly
Secret leakage
Secrets only in OS-protected storage; never in renderer state, logs, journals, receipts, exports or fixtures; exports exclude secrets by default
OAuth
Authorization-code with PKCE and loopback redirect, minimal scopes, revocation, token refresh in Main, no live-account claim without verified authorization
Protected services, startup entries, registry keys
Classification catalog enforced in Main; critical items read-only
Deletion
Quarantine first; irreversible deletion only with a second explicit consent and a receipt
Resource exhaustion
Bounded concurrency, memory ceilings, throttled events, worker isolation for heavy work
Log privacy
Paths in logs follow a redaction policy; no file contents; no credentials
Installer / update
Signed artifacts, verified update source, profile migration tested from a prior version
Consent tokens are operation-specific, scope-specific, time-limited and, for destructive operations, single-use. Consent shown in the UI is advisory; Main re-checks.
13. Remaining External Dependencies and Explicit Blockers
Blocker
Affects
Handling
Repository not readable in this authoring session (automated access refused)
Every NOT VERIFIED status; Vol. 6 matrix
Codex runs Section 3.3 and fills the matrix from evidence
Real catalog IDs and native operation IDs unknown
Section 6.2 reconciliation
Codex builds the four-way mapping
Google OAuth client ID/secret and Workspace eligibility (Chat, Classroom)
D04, D14.03
Implement to the credential boundary; status needs-credential; list in handover; never fake a connected account
AI provider keys
D14.02, D14.08
Same as above; rule-based explainers must still work without a key
Administrative elevation
D11, D12, D09 changes, D10.24
Status needs-elevation; simulated-runner tests; real execution only with explicit authorization
Windows host / VM
Layer 5–7 verification
Mark needs-windows-host until proven
Hardware sensor availability (thermals, S.M.A.R.T., battery wear)
D07.09, D10.26, D10.30, D10.31
Capability detection; honest unsupported states; no synthetic values
Code-signing certificate and update infrastructure
Release layer
Document; do not fabricate signing
14. CODEX — EXECUTE THIS SPECIFICATION
Codex: you are the implementation authority for this product. This is an execution contract, not a planning exercise.
1. Inspect the real state first. Run Section 3.3, record outputs verbatim, locate every reference artifact in Section 3.4, and reconcile the 181 entries across ledger, catalog, UI and native operations (Section 6.2).
2. Preserve everything. Create the safety net in Section 4 before any branch operation. Never reset, clean, force-push, rewrite shared history, delete a branch or remove a worktree. Respect other active agents and their worktrees.
3. Replace NOT VERIFIED with evidence. Fill the status of every service using the vocabulary in 8.2 and the 15 questions in 8.3. Do not rebuild what exists and works; document it and protect it with regression tests.
4. Implement real functionality. For each service with a proven gap, implement the missing provider, executor, IPC contract, consent boundary, persistence, progress, cancellation, error handling, undo/recovery, inspector and live UI binding that the contract in this specification requires. Complete the whole operational lifecycle applicable to the service.
5. Integrate into the existing UI. Reuse the Living Glass headers, artwork, orbital engine, compact selectors and existing workspaces (for example ScanServiceWorkspace, ScanStageConsole, ScanReviewInspector). Do not duplicate architecture and do not replace working components without evidence.
6. Never fabricate. No demo numbers as measurements, no fake percentages, no synthetic time series, no claimed live Google/AI connection without verified authorization, no antivirus claims, no space-freed claims for quarantine on the same volume.
7. Protect user data and consent. Quarantine before deletion, plan-hash-bound approval, journaled operations, verified postconditions, no operation on owner data or system without explicit operation-specific consent.
8. Test at every layer. Add focused tests, run them, and record command, exit code, counts, SHA and environment. Verify real Electron operation. Verify Windows-native behavior where a Windows host is available. Never claim a higher layer from a lower one.
9. Commit only verified, owned changes, with exact-SHA evidence. No automatic merge to main. No merging of OpenHands or historical branches without review.
10. Handle credentials without stopping. Where a provider key, OAuth client, certificate or elevation is missing, implement everything up to that boundary, expose the honest capability state, and list the exact requirement in the final handover. Do not stop and do not ask.
11. Do not stop at a report. After each verified slice, choose the next independently safe item across all fourteen domains and implement it. Dependency order, not a calendar, decides sequence: shared services first (capability registry, operation coordinator, event bus, journal/receipt store, scope manager, filesystem walker, process runner), then Domain 03, then Smart Scan, Files, Storage, Cleanup, Repair, Startup, Services, System, Applications, Automation, Settings/AI, Google Workspace, Home.
12. Report remaining blockers accurately in a final handover: scoreboard per service with evidence, blocked-on-owner-input list, items needing a Windows host, known limitations, decisions taken.
No feature is DONE because a component renders. No functionality is replaced by a read-only placeholder. No unauthorized destructive change. No fake completion.
Volume 2 — Smart Scan, Home, Files, Storage
Volume 2 continues in this document so the master inventory, template and Codex contract stay beside the contracts they govern. For every service below, parts C (existing implementation), D (evidence status) and L (delivery proof) of the 12-part template are NOT VERIFIED until repository inspection. Parts A, B and E–K are the REQUIRED contract, written compactly: Objective · Backend · Frontend · Safety · Errors · Acceptance. Service names are SUPPLIED; everything else is REQUIRED behavior.
15. Domain 02 — Smart Scan (10 entries)
Smart Scan is an analysis center. It observes, classifies and recommends. It never deletes, moves or reconfigures anything; every action leaves through a typed handoff to the owning domain with plan-bound consent.
15.1 Shared Smart Scan rules (REQUIRED)
• One traversal engine. All file-based services (D02.01–D02.06) use the shared bounded, cancellable, Unicode- and long-path-safe walker. Two services scanning the same authorized scope within a freshness window reuse the same index snapshot instead of re-walking; snapshot age is shown to the user.
• Scope. Folder-based services require an authorized scope (D03.01). Provider-based services (D02.07–D02.09) need no folder but state their data source and sample time.
• Event stream. Each run emits the normalized envelope from 5.3: stage, measured counts (scanned, matched, skipped, errored), bytes, latest event, warnings. progress.measured stays null until a true total exists.
• Result persistence. Every completed or cancelled run stores a session record (parameters, counts, findings reference, provider, timestamps, partial flag) for history and export. Findings are exportable as JSON and CSV with paths subject to the log-privacy policy.
• Finding model. findingId, serviceId, kind, severity (info, low, medium, high), evidence {paths|entries, bytes, measured values, sampleTime}, explanation, proposedHandoff {destinationService, payloadRef, risk, approvalRequired}. A finding without evidence is invalid and rejected.
• Honest idle. With no authorized source, a folder-based service shows the No authorized source state with a direct path to D03.01. It never shows sample findings.
15.2 Quick Scan vs Deep Scan (the explicit difference)
Property
Quick Scan (D02.01)
Deep Scan (D02.02)
Purpose
Fast orientation of an authorized scope
Thorough analysis of an authorized scope
Traversal
Bounded by item budget, time budget and depth limit
Full recursion, configurable depth and exclusions
Reads
Directory metadata only
Metadata plus bounded content sniffing (file signatures)
Result
Counts by category, top folders, recent changes, obvious anomalies
Signature/extension mismatches, unreadable and locked items, attribute anomalies, reparse points, very deep paths, partial-result accounting
Completeness claim
Never claims completeness; reports what the budget covered
Claims completeness only when traversal finished with zero unexplained gaps
Antivirus claim
None
None. Output is analysis, never protection, unless a qualified detection engine is integrated and its provenance shown
15.3 Per-service contracts
D02.01 — Quick Scan
• Objective: a first look at what is in the authorized folders within seconds, with real numbers.
• Backend: quickScan({sourceIds, budget:{items, ms, depth}}) → session. Classification by extension map; findings: largest items, newest changes, category totals, empty-folder count. Budget exhaustion yields PARTIAL with the covered fraction expressed as counts, not an invented percentage.
• Frontend: stage console with live counts, category chips, top-folder list, finding inspector with real file info and reveal action; completion banner states exactly what was covered.
• Safety: read-only.
• Errors: denied directories listed as skipped, not hidden; scope revoked mid-run cancels.
• Acceptance: fixture with known counts: totals match ground truth within covered scope; budget of 100 items over 10k-file tree reports PARTIAL with 100 items scanned; cancellation latency bounded; second run reuses snapshot and says so.
D02.02 — Deep Scan
• Objective: a defensible deep inventory of anomalies and structure.
• Backend: deepScan({sourceIds, depth?, exclusions[], signatureBytes, concurrency}). Signature table (magic bytes) for common formats; extension/signature mismatch is a finding, not a verdict of malice. Bounded memory (streaming), bounded concurrency, partial results emitted incrementally. Diagnostics list every skipped path with error class.
• Frontend: same workspace pattern as Quick Scan with a diagnostics tab and an exclusions editor; mismatch findings explain what was compared.
• Safety: read-only; reads at most the configured header bytes per file; never opens files in sensitive-credential locations.
• Acceptance: fixture with renamed-extension files flags exactly those; junction loop not followed; 260+ char paths traversed; locked file reported; cancel mid-run returns partial results with correct counts; no antivirus wording anywhere in UI strings.
D02.03 — Duplicate Finder
• Objective: find byte-identical files and quantify reclaimable space.
• Backend: pipeline: group by size → drop singletons → partial hash (head, middle, tail) → full SHA-256 → optional byte-for-byte verification (verify:true) → groups. Reclaimable bytes = sum of sizes of all but one member per group, minus members in protected sources. Hardlinks to the same file identity are one copy, not duplicates. Each group carries keep-recommendation metadata (oldest, shortest path, preferred folder) with the reason; recommendation is advisory.
• Exact vs similar: similar images (perceptual hashing) is a separate labeled analysis, never merged into exact groups and never counted as reclaimable.
• Frontend: group list sorted by reclaimable bytes, member inspector with real names/paths/dates, selection helpers that mark nothing deleted; handoff button builds a Cleanup preview (D08) via typed payload.
• Safety: read-only; never deletes; hardlink and reparse awareness.
• Acceptance: fixture with exact copies, same-size different-content decoys, hardlinks, zero-byte files, and a protected-source copy: groups equal ground truth; decoys excluded after hashing; reclaimable bytes exact; byte-verify catches an injected hash-collision double; cancellation during hashing stops reads.
D02.04 — Large Files
• Objective: show where the bytes are.
• Backend: largeFiles({sourceIds, minBytes, pageCursor, sort}) over the index; folder grouping with subtotal bytes; cursor pagination; attributes (compressed/sparse/reparse) from real metadata.
• Frontend: ranked list, folder grouping toggle, size threshold control, inspector, reveal; handoff to D07.02 and Cleanup preview.
• Safety: read-only. Acceptance: sparse-file fixture reports logical vs allocated size correctly where the provider supports it and says so where it does not; pagination stable under concurrent changes; threshold edge cases (exactly at threshold).
D02.05 — Junk Cleaner
• Objective: discover safe cleanup candidates and build a plan; the name is a UI label, the service only discovers and plans.
• Backend: allowlisted candidate locations (user/system temp, thumbnail and shader caches, crash dumps, logs, Windows Update download cache metadata, Recycle Bin summary) each with category, source, owner and risk; real measured size per candidate; protected paths and in-use files excluded; user exclusions honored. Output is a CleanupPlan draft with plan hash, handed to D08. No deletion here.
• Frontend: candidate groups with real sizes, an explanation per category of what it is and why it is considered safe, risk badge, exclusion toggles; "Send to Cleanup" only.
• Safety: read-only discovery; elevated-only locations flagged needs-elevation rather than guessed.
• Acceptance: fixture temp tree: sizes exact; a protected path planted among candidates is excluded; an in-use file is excluded; plan hash changes with exclusions.
D02.06 — Privacy Trace Check
• Objective: show where privacy-relevant artifacts exist without reading their contents.
• Backend: metadata-only discovery of known artifact locations (recent-items lists, jump lists, browser profile directories by presence/size/date, clipboard history presence, thumbnail caches). Never opens credential stores, password databases, cookies or tokens; never parses browser databases. Risk classification is by artifact type and age, with the rule shown.
• Frontend: artifact categories with counts, sizes, last-modified; a clear statement of what was and was not examined; handoff to D08 for review, never one-click removal.
• Safety: sensitive-path guard enforced in Main; results contain paths and metadata only.
• Acceptance: fixture with a decoy "credentials" file confirms zero content reads (instrumented read counter = 0); results exclude content; log redaction verified.
D02.07 — Startup Impact
• Objective: show what starts with Windows and what it plausibly costs.
• Backend: reuse the D09 source enumerators (registry Run/RunOnce for machine and user, startup folders, logon scheduled tasks, relevant auto-start services). Fields: name, command, publisher (from signature where available), enabled state, source, scope. Boot-time cost is reported only from measured sources (Windows diagnostics events when present); otherwise unavailable with reason. Recommendations cite entry attributes, never invented milliseconds.
• Frontend: list with source icons, publisher, enabled state, measured impact column that shows — plus reason when unmeasured; handoff to D09 for change preview.
• Safety: read-only here. Acceptance: registry fixture (or simulated provider) with entries across all sources: all enumerated; disabled entries marked via StartupApproved state; no impact numbers appear without a measured source.
D02.08 — App Health
• Objective: summarize installed-application condition from real indicators.
• Backend: inventory (uninstall registry views, Appx/MSIX) with publisher, version, install date, estimated size where reported. Health indicators only those actually obtainable: missing install directory, broken uninstall string target, unsigned or invalid signature, duplicate registrations, pending update known to winget. Provider limits (apps that do not report size/date) are displayed.
• Frontend: list with indicator badges, inspector, link to D05 detail.
• Safety: read-only. Acceptance: fixture registry with a stale entry (missing directory) flagged; app without publisher shows unknown, not a guess.
D02.09 — System Health Pulse
• Objective: real, timestamped CPU, memory and disk observations.
• Backend: sampler producing {metric, value, unit, sampleTime, provider} at a bounded interval; ring buffer persisted only if the user enables history; no interpolation or synthetic backfill. Thresholds for findings are explicit and shown.
• Frontend: instruments and sparklines drawn only from stored real samples; stale-sample indicator when the sampler is paused.
• Safety: read-only. Acceptance: injected provider produces known series; chart equals series exactly; sampler stop shows stale state; no sample exists before the first real reading.
D02.10 — Smart Recommendations
• Objective: turn measured findings into explainable, approvable next steps.
• Backend: deterministic rule engine over findings of D02.01–D02.09. Each recommendation: evidence[] (finding IDs), severity, explanation, proposedAction, risk, destinationService, approvalRequired. Dedup and ranking by evidence weight. Optional model-generated wording may rephrase an explanation but cannot add facts, change numbers or create actions; it is off when no provider exists, and the rule engine output stands alone.
• Frontend: recommendation cards that expose their evidence on expand; action buttons navigate to the destination with a prefilled typed payload; dismissal persisted.
• Safety: recommends only; no autonomous destructive operations.
• Acceptance: each rule has a fixture proving it fires and a fixture proving it stays silent; removing a finding removes its recommendation; no recommendation lacks evidence.
16. Domain 01 — Home Command Center (12 entries)
Home is an operational command center that aggregates real state from other domains. It owns no engine of its own except aggregation, search routing and the pending-approval view. The approved Home visual hierarchy and Living Glass architecture are preserved (Codex-owned); this chapter specifies data and behavior only.
16.1 Shared Home rules (REQUIRED)
• Provenance on every card. Each card carries a provenance line: source service, provider, sample or session time. A card whose source has no data shows the honest empty state for that source, never a placeholder number.
• Cold-start matrix. The UI must define and test four conditions: (1) first launch, nothing authorized; (2) sources authorized, no scan run; (3) a provider unavailable (for example no Windows host features); (4) normal operation. Each condition has a distinct, truthful presentation, and every card states which condition it is in.
• Aggregation via contracts, not copies. Home subscribes to the normalized envelope events and reads receipts and session records from the stores; it does not duplicate engines or cache numbers longer than their stated freshness window.
• Refresh. Cards refresh on events where available, otherwise on a bounded interval; each shows its age. Stale (older than its window) cards are visibly marked stale.
• Navigation. Every card and shortcut navigates through the same route registry as the section headers; deep links carry a typed payload (for example a finding ID) that the destination validates.
16.2 Per-service contracts
The first eight entries are navigation-plus-summary shortcuts. Their shared contract: a summary query returning {headline metrics, lastRun {sessionId, time, partial}, capabilityStatus, provenance} from the owning service and a navigation action to its workspace. Differences per entry are listed below.
D01.01 — Smart Scan
• Summary: latest session per Smart Scan service (counts, severity totals, partial flags). Action: open Smart Scan; start Quick Scan only when a source is authorized and the user clicks. Empty: No scan has run with an authorization shortcut. Acceptance: fixture sessions produce exact totals; a cancelled session displays as cancelled with its partial counts; no sources → empty state, no numbers.
D01.02 — Organize Files
• Summary: authorized source count, last inventory time and item count, latest plan state (draft, approved, executed, stale), last receipt outcome. Action: continue the Organization journey at the correct stage. Safety: Home never executes a plan. Acceptance: a stale plan shows stale with reason; an executed plan links its receipt; an approval token never appears in UI text.
D01.03 — Applications
• Summary: installed-app count, recently changed count, apps with update known (only if winget data exists, else unavailable). Acceptance: counts equal the inventory; provider absence is stated.
D01.04 — Storage
• Summary: real used/free/total per volume, last scan coverage per volume, capacity trend only from stored real samples. Acceptance: provider-injected volumes display exact values; a volume without a scan shows not analyzed; no trend line before two real samples exist.
D01.05 — Cleanup
• Summary: latest cleanup plan draft size (measured), quarantine vault size and count, last recovery availability. Rule: Home never presents quarantined bytes as freed disk space (same-volume quarantine frees nothing physically). Acceptance: vault fixture counts match manifest; copy states quarantine vs deleted distinctly.
D01.06 — Startup Control
• Summary: autorun entry count by source, enabled count, last change receipt. Acceptance: source enumeration fixture matches; unreadable sources are listed as unreadable, not zero.
D01.07 — System Live Pulse
• Summary: live CPU/memory/disk from the sampler with sample time; sparkline from real stored samples only. Rule: if the sampler is not running, the card shows the last real sample with an age marker. Acceptance: injected sampler series equals the rendered series; stopping the sampler produces the stale marker within one interval.
D01.08 — Repair Lab
• Summary: last repair receipt per operation, elevation state, pending-reboot indicator when detectable. Action: open the Repair workbench; Home never launches repairs. Acceptance: receipts render exit code and verification outcome; no operation is startable from Home.
D01.09 — Global Search
• Objective: one search box routing to the right domain.
• Backend: search(query, {scopes[]}) fans out to the Files index (D06.07), service/catalog names, settings, history/receipts and help, with per-source timeouts and a merged, ranked result stream; results carry source, type, path/target and a typed open action. Query parsing supports plain text plus optional operators (ext:, size:, date:, in:) defined once and shared with D06.07. Files results come only from authorized indexes.
• Frontend: instant result list grouped by source, keyboard-first (arrow/enter/escape), highlights, empty and index not ready states, reveal/open actions through validated IPC.
• Safety: read-only; opening a file defers to OS association via the validated open action; results from revoked sources vanish immediately.
• Acceptance: fixture index returns exact ground-truth matches for operator queries; a slow source times out without blocking others (flagged incomplete); search latency recorded against the Files benchmark (see D06.07); revoked source results disappear without restart.
D01.10 — KNOuX Insight
• Objective: the explainable recommendation view on Home.
• Backend: a read-through of D02.10 recommendations plus cross-domain rules that use only measured data (low free space, many stale quarantine items, startup growth between two real inventories). Each insight carries evidence IDs and links; no insight without evidence; model wording optional and fact-neutral.
• Frontend: insight cards with Why this? expansion and a destination button; dismissal persists; honest Nothing to report state.
• Acceptance: each rule fires and stays silent on matching fixtures; removing underlying data removes the insight; no insight without a resolvable evidence reference.
D01.11 — Recent Activity
• Objective: a truthful feed of what KNOuX actually did.
• Backend: query over the journal and receipt stores with type, service, outcome, since filters; entries are references (receipt/session IDs), not copies. Retention follows policy; entries for undoable operations persist while undo is feasible.
• Frontend: time-ordered feed with outcome badges, durations and a link to the receipt; filters; empty state Nothing has run yet.
• Acceptance: executing, cancelling and failing operations each appear exactly once with correct outcomes; restart preserves the feed; a corrupt receipt is flagged and does not break the feed.
D01.12 — Pending Safe Actions
• Objective: one place to see what is waiting for the user's approval or elevation.
• Backend: the Consent/Approval store lists open items: draft plans awaiting approval, undo previews awaiting confirmation, elevation-gated repairs staged, scheduled automation runs needing preapproval renewal. Each item shows the plan hash or operation, scope, risk, expiry and the owning workspace link. Expired or hash-stale items are shown as expired and cannot be approved.
• Frontend: list with risk badges, expiry countdown computed from real expiry timestamps, Review button that opens the owning workspace's review step. Approving from Home is not allowed for destructive items; Home navigates to the review step where the preview is shown.
• Safety: tokens never displayed or logged.
• Acceptance: creating, approving, expiring and invalidating a plan each updates the list correctly; a destructive item cannot be approved from Home (UI absent and Main rejects the call); restart preserves open items and recomputes expiry.
17. Domain 06 — Files (12 entries)
Files is a fast, intelligent discovery environment inspired by Everything-style instant search in responsiveness, without copying its interface. It is built on the same shared index as Smart Scan and Organization Studio; it must not maintain a competing walker or index.
17.1 Shared Files rules (REQUIRED)
• Authorized indexes only. The index covers authorized sources (D03.01). Fixture data is labeled as fixture and never shown as owner files.
• Index structure. An in-memory, compact name/extension/size/time index, persisted as a versioned snapshot so cold start is fast, with a background reconciliation pass. Updates are incremental: change detection prefers the NTFS change journal (USN) on local NTFS volumes where permitted, otherwise directory watchers plus periodic bounded rescans; the active method is shown per source.
• Honest freshness. Each result set states index age and whether reconciliation is in progress. A result for a file that no longer exists is removed on touch and never opened.
• Search semantics. Case-insensitive substring and prefix matching on name, optional wildcard/regex mode, extension filter, size and date ranges, attribute filters, path scoping. Operators match D01.09. Result sorting is stable; ranking never reorders explicit sorts.
• Virtualization. Result lists render by window with a stable cursor; keyboard navigation is complete.
• Benchmarks, not claims. Codex measures and records search latency and index build time on fixtures of 10k, 100k and (where feasible) 500k entries, on named hardware, and reports the numbers. No Everything-equivalent claim without a measured comparison. Suggested targets to measure against, not claims: typical queries returning the first page within a perceptible-instant window on the 100k fixture; index memory growth linear in entries.
• Contextual actions (reveal in Explorer, open, copy path, send to Organization, send to Cleanup preview, compute hash) go through validated IPC and re-authorize the path in Main.
17.2 Per-service contracts
D06.01 — Downloads Folder Inventory
• Objective: see the Downloads folder as a real, categorized inventory. Backend: resolves the OS Downloads known folder, requires authorization before indexing, then reports counts, bytes, age distribution, installer/archive/media shares. Frontend: category cards with real filenames and a recency list; one-click handoff to the Organization Builder with a Downloads preset. Safety: read-only. Acceptance: not authorized → state with authorization shortcut; fixture Downloads tree totals exact; relocated Downloads folder resolved correctly.
D06.02 — Visual Rule Builder & Organization Studio
• Objective: a Files-side entry to the Organization rule editor, sharing D03.04's engine. Backend: none of its own; it calls the same rule schema, validator and match-preview endpoints. Frontend: visual rule cards with live match counts and example files; identical persisted rules as D03.04 (one source of truth). Acceptance: a rule created here appears in D03.04 and vice versa; deleting from either removes from both; no duplicate rule store.
D06.03 — Organization Staging & Change Review
• Objective: review the staged organization changes from Files. Backend: reads the current draft plan (D03.06) and diff-views it against the filesystem (stale detection). Frontend: staged moves grouped by rule with a changed since planning marker; approval is not available here, only navigation to D03.06. Acceptance: staleness appears after an external modification; plan content equals D03.06's.
D06.04 — File Organization Undo Timeline
• Objective: a Files-side view of reversible organization receipts. Backend: reads D03.08 receipts and previewUndo; undo is performed through D03.08 only. Frontend: timeline with per-receipt feasibility; Undo opens D03.08's confirmation. Acceptance: feasibility matches D03.08 results for the same receipt; no second undo implementation exists.
D06.05 — Sparse Empty Folder Explorer
• Objective: find empty and near-empty folder trees. Backend: recursive evaluation on the index: empty, contains only empty folders, contains only zero-byte or only ignorable system files (explicit ignorable list, user-extendable). Reparse points are reported, never descended. A cleanup plan (remove empty folders) is a draft only, handed to D08; removal there is journaled and reversible via recreation. Frontend: tree with depth, classification reason, size zero; select-to-plan. Safety: read-only here. Acceptance: fixture with nested empty chains, folder holding only desktop.ini, junction to non-empty folder (not counted empty), and a folder with a hidden file (not empty).
D06.06 — Cryptographic Hash Inspector
• Objective: compute and verify file hashes. Backend: hashFile(path, algorithms[]) (SHA-256 default; MD5/SHA-1 labeled legacy, non-security; SHA-512 optional) as a streaming, cancellable read with progress by bytes; compare against a pasted expected value with normalization (case, whitespace); folder manifests exportable. Path re-authorized in Main. Frontend: drag/pick file, progress by measured bytes, result with copy, compare field with explicit match/mismatch. Safety: read-only. Acceptance: known test vectors for each algorithm; 4 GB sparse file streams within bounded memory; cancel stops reads; locked file reports FILE_LOCKED; mismatch is unambiguous.
D06.07 — Instant Everything-Style File Search
• Objective: instant filename and metadata search over authorized indexes. Backend/Frontend: per 17.1 (index, USN or watcher updates, operators, virtualization, actions). Search requests are cancelable and superseded by newer keystrokes; results stream. Metadata search (size, dates, attributes, extension) uses the same index; content search is out of scope unless a separate, explicit, authorized feature is specified. States: index building (partial results flagged), index stale, no authorized source, provider limitation (for example no USN access). Acceptance: ground-truth match sets on fixtures for wildcard, regex, size and date queries; incremental update visible within one update cycle after file create/rename/delete; latency measured and recorded; revoked source disappears from results immediately; Unicode and long-path names searchable.
D06.08 — File Format Type Distribution
• Objective: where bytes and counts sit by file type. Backend: aggregation on the index by category and extension with count, bytes, share. Frontend: distribution chart from real aggregates and a table of top extensions; click filters the library/search. Acceptance: totals equal the index; unknown extensions grouped as other with the list reachable; sums reconcile to the index total exactly.
D06.09 — Recent File Timeline Histogram
• Objective: activity over time by modified/created/accessed. Backend: time-bucketed counts (day/week/month chosen by span) from real timestamps; last-access caveat displayed because Windows may not update access times. Frontend: histogram with bucket drill-down; selecting a bucket opens its files. Acceptance: bucket boundaries respect local time zone and DST; counts sum to the indexed total; files with invalid timestamps listed separately.
D06.10 — Ranked Large File Explorer
• Objective: top-N files by size with folder context. Backend: index ranking with cursor pagination and threshold; same ranking function as D02.04 (shared, not forked). Frontend: ranked list with size bars from real sizes, folder breadcrumb, inspector, actions. Acceptance: results identical to D02.04 for the same scope and threshold; ties ordered deterministically.
D06.11 — Deep File Metadata & Attributes Dossier
• Objective: everything knowable about one file, labeled by provenance. Backend: getDossier(path) returns: basic stat, NTFS attributes, timestamps (created, modified, accessed, change), file identity and hardlink count, reparse info, alternate data stream names (names and sizes only, content not read), owner and ACL summary (read-only, summarized), embedded metadata for supported formats (image dimensions/EXIF subset, media duration, document properties) read from the file with each field tagged with its reader. Fields a reader cannot supply are absent. Safety: read-only; EXIF location data is shown only after a visible expand action and never exported by default. Acceptance: fixture files with known metadata return exact values; ADS fixture lists the stream without reading it; unreadable ACL yields a labeled partial dossier.
D06.12 — Trust Evidence & Provenance Board
• Objective: show what is known about where a file came from and whether it is signed. Backend: Zone.Identifier (mark-of-the-web) presence and zone ID, Authenticode signature status via the signature provider (valid, invalid, unsigned, untrusted publisher, timestamp info), file hashes, location class, first-seen time in the KNOuX index. It reports evidence; it does not issue safe/malicious verdicts. Frontend: evidence cards each marked with source and certainty; a plain statement No verdict is made. Acceptance: fixture with MOTW stream, signed binary, tampered signed binary (invalid), and unsigned file produce the expected evidence; no verdict language appears in UI strings.
18. Domain 07 — Storage (12 entries)
Storage explains where capacity goes and what could be reclaimed, using real Windows volume data and authorized analysis. It never implies that bytes are free when they are not.
18.1 Shared Storage rules (REQUIRED)
• Volume truth. Used, free and total come from the volume itself (the filesystem's reported values), per volume, with filesystem type, drive kind (fixed, removable, network, virtual/VHD, optical) and read-only flag. Values are timestamped and are never derived from KNOuX scans. Where the provider cannot report a value, the field is absent with a reason.
• Analysis vs capacity. Folder analysis (D07.02–D07.06) covers only authorized scope and reports its own coverage (bytes analyzed vs volume used). The gap is shown as unanalyzed, never silently attributed to files.
• Allocated vs logical size. Where the provider exposes it, sizes distinguish logical size from size on disk (compression, sparse files, cluster slack, hardlinks counted once). When it does not, the UI states which is shown.
• Reclaim honesty. Reclaimable estimates are sums of measured sizes of specific candidates. Quarantine on the same volume frees zero physical capacity until the quarantine is purged; copying to another volume then removing frees space only after verification. Every reclaim figure states which of these applies. No invented savings.
• Cancellation and caching. Analyses are cancellable, cached per scope with a snapshot time, and invalidated by change detection or user refresh. Treemap and ranking views read the same snapshot so numbers reconcile across D07.02–D07.06 and D06.
• Drive-type honesty. SSD, HDD, removable and virtual volumes differ in available telemetry; the UI shows the capabilities that exist for that drive and labels the rest unsupported with the reason.
18.2 Per-service contracts
D07.01 — Volume Bays & Partition Manager
• Objective: a truthful map of volumes and partitions. Despite Manager in the name, the REQUIRED scope is read-only discovery: disks, partitions (style GPT/MBR, type, size, offset), volumes (letter, label, filesystem, used/free/total, health status), mount points, BitLocker status where readable, system/boot flags. Partition create, delete, format or resize are out of scope and must not exist unless a separate specification adds them with elevation and typed consent.
• Frontend: bay cards per volume with exact capacity bars from real values, partition strip per disk with real extents, details inspector, hot-plug refresh; unavailable fields shown as — with reason.
• Acceptance: provider-injected topology (multi-disk, hidden recovery partition, unlettered volume, mount-point volume) renders exactly; removable disk added/removed updates within one refresh; no write control exists in UI or IPC.
D07.02 — Heavy-File Storage Ledger
• Objective: ledger of the largest files per volume/scope. Backend: the shared ranking from D02.04/D06.10 with per-volume totals, share of analyzed bytes, and age classification. Frontend: ledger table with sparkline-free, number-first presentation, filter by volume, handoff to D08 preview. Acceptance: identical ordering to D02.04 on the same snapshot; per-volume totals reconcile to the snapshot.
D07.03 — Byte-Exact Duplicate Hash Groups
• Objective: duplicate groups across volumes within authorized scope. Backend: the D02.03 pipeline, extended with cross-volume grouping and a per-group note when members sit on different volumes (cross-volume duplicates reclaim on the volume where the removed copy lives). Frontend: groups with member volume labels, keep-recommendation, reclaimable bytes per volume. Safety: read-only. Acceptance: cross-volume fixture gives per-volume reclaim figures that sum to the group total; hardlinks excluded.
D07.04 — Interactive Storage Space Treemap
• Objective: see space as nested rectangles. Backend: storageTree(scope, depth) returns a size-annotated directory tree from the snapshot, with a node-count ceiling: nodes smaller than a threshold are aggregated into a labeled other (N items) node whose count and bytes are exact. Layout (squarified algorithm) is computed from real byte values; rectangle area is proportional to bytes, deterministically. Frontend: zoom-in on directories, breadcrumb, hover/inspector with exact size and share, keyboard navigation, color by category or age; tiny nodes never hidden — they are aggregated visibly. Acceptance: sum of child areas equals parent area within rounding; aggregated node counts reconcile to ground truth; 1M-entry fixture renders within the ceiling without exceeding memory bounds; layout identical for identical input.
D07.05 — Folder Ranking Waterfall
• Objective: which folders account for the most bytes. Backend: ranked folder sizes (inclusive and exclusive), cumulative share. Frontend: a waterfall-style cumulative view drawn from the ranked values (steps equal the folder sizes, running total shown), with the remainder bar labeled all others so the total equals analyzed bytes. Acceptance: cumulative total equals analyzed bytes exactly; inclusive vs exclusive toggle consistent with the treemap tree.
D07.06 — Storage Byte Distribution by Category
• Objective: bytes by file category. Backend: category aggregation on the snapshot; categories match D06.08 definitions (single classifier). Frontend: distribution chart plus table; click filters to Files. Acceptance: category sums equal analyzed bytes; classifier changes propagate to both D06.08 and D07.06.
D07.07 — Drive Coverage & Scan Dashboard
• Objective: show how much of each volume has actually been analyzed. Backend: coverage = analyzed bytes ÷ volume used bytes, per volume, with last-scan time and scope list; also shows excluded and protected areas as not analyzed. Frontend: per-volume coverage bars (with exact figures), scan history, rescan actions; never rounds coverage up. Acceptance: coverage values reproduce from snapshot and volume data; protected exclusions appear as unanalyzed.
D07.08 — Drive Optimization & TRIM Dossier
• Objective: report optimization-relevant facts. Backend (read-only): media type (SSD/HDD where reported), TRIM/retrim support state as reported by the OS, last optimization time and recommended action as reported by the system's own optimization facility, fragmentation level only where the OS provides an analysis result for HDDs. KNOuX does not invent fragmentation or wear numbers. Running optimization is not required; if later added it is an allowlisted, elevated, consent-gated operation recorded in the journal. Acceptance: provider-injected SSD and HDD profiles show appropriate fields; a volume with no data reports unavailable, not a default.
D07.09 — Disk Reliability & S.M.A.R.T. Health
• Objective: surface the reliability data Windows exposes. Backend: storage reliability counters (temperature, wear, power-on hours, read/write error counts, predictive-failure flag) where the driver exposes them; S.M.A.R.T. attributes only where reachable without vendor tools. NVMe, SATA, USB bridges and RAID controllers differ; support is detected per disk and shown. Rule: no health score is invented; the UI shows the raw reported values with units and the OS's own predictive-failure state. Frontend: per-disk instrument cards, each field flagged reported or unsupported. Acceptance: injected profiles for NVMe, SATA and USB-bridged disks (the last unsupported) render correctly; no field appears without provider data.
D07.10 — Storage Reclaim Planner & Basket
• Objective: assemble candidates from Smart Scan, duplicates, large files and cleanup into one reviewed basket and hand it to Cleanup. Backend: basket holds references (file identity + path + size at add time), deduplicates across sources, rechecks existence and size at review, and computes three separate numbers: bytes in basket, bytes physically freed immediately if the chosen method is permanent removal, and bytes freed only after a later quarantine purge (zero immediately). Hands off as a draft Cleanup plan (D08.05) with a plan hash. Frontend: basket with per-item real sizes, method selector reflecting the three numbers, clear statements; no execution here. Acceptance: adding the same file from two sources yields one entry; a file changed after adding is flagged; same-volume quarantine shows 0 freed now; numbers reconcile.
D07.11 — Capacity Trend Timeline
• Objective: capacity over time. Backend: persists periodic real volume samples (used/free/total, timestamp) at a bounded interval and on scan completion; retention policy rolls old samples into daily summaries. Frontend: line drawn from stored samples only; a minimum of two samples required before any trend is drawn; gaps shown as gaps; projection (days-to-full) only when at least a stated minimum span exists and labeled estimate from observed trend with its basis. Acceptance: stored series equals rendered series; clock changes and sleep gaps are handled; no backfill.
D07.12 — Removable USB & External Volume Dock
• Objective: manage awareness of removable and external volumes. Backend: hot-plug events, volume identity (serial/GUID), label, filesystem, free/total, read-only flag, authorized-source status for sources that live on the device. Safe-eject is not implemented by KNOuX unless specified and verified; the UI links to the OS action. Operations in progress on a removable volume are surfaced before it is removed. Frontend: dock of connected volumes with real values, warning when an active session or plan references the volume, honest disconnected state for known-but-absent volumes. Acceptance: plug/unplug fixtures update the dock; a plan whose destination volume disappears is marked stale and blocks execution; re-insertion restores authorized-source status only if identity matches.
Volume 3 — Cleanup, Startup, Repair Lab, Services Commander
Same conventions as Volume 2: parts C, D and L are NOT VERIFIED until repository inspection; the contract below is the REQUIRED behavior. Repository access remained blocked while writing this volume.
19. Domain 08 — Cleanup (12 entries)
Cleanup is a safety-first maintenance center. It distinguishes three kinds of operation and never blurs them in code or UI: read-only discovery, reversible quarantine, and irreversible deletion.
19.1 Shared Cleanup rules (REQUIRED)
Rule
Requirement
Operation classes
DISCOVER (no change) · QUARANTINE (move into a managed vault with manifest, reversible) · PURGE (permanent removal of vault items or of items the user explicitly marks for permanent removal). Class is part of every plan item and receipt.
Default
QUARANTINE. PURGE requires a second, separate consent token bound to the exact item set, and a receipt.
Provenance
Every candidate records why it is a candidate: category, rule or location source, measured size, last access/modify, owner, in-use state.
Protected paths
Windows directory, Program Files trees, the application's own data and vault (except through vault operations), credential and browser-secret stores, user documents folders by default, and any path the user excluded. Enforced in Main, not in the UI.
Plan binding
Execution requires a plan hash and approval token exactly like Organization Studio (Section 9.3): stale hash or changed file identity/size/mtime invalidates the item.
Journal before effect
Intent recorded first; outcome recorded after; restart reconciliation truthfully inspects the filesystem.
Verification
After QUARANTINE: source absent, vault copy present with matching size/hash; after PURGE: item absent. Failures are recorded per item and never hidden.
Space truth
Measured sizes only. Quarantine on the same volume frees nothing physically (Section 18.1); the UI states bytes quarantined separately from bytes freed.
Cross-volume vault
When the vault is on a different volume than the item, quarantine is copy → verify → remove source, with the same failure semantics as Section 9.3.
19.2 Vault design (REQUIRED)
Vault location is an authorized, application-owned directory on a chosen volume; its free space is checked before any quarantine. Each item gets an opaque vault name; a signed-by-checksum manifest (itemId, original canonical path, identity, size, hash, mtimes, attributes, ACL summary, quarantined-at, receipt ref, retention deadline) is the only way to restore. Restore recreates the original directory chain only if its parent still exists or the user approves recreation; a conflicting item at the original path triggers the collision strategies (never overwrite). Vault retention is a user policy; the default never auto-purges items younger than the configured period, and purge of expired items is itself an approved, journaled operation.
19.3 Per-service contracts
D08.01 — Temporary Files Candidate Safety Ledger
• Objective: a ledger of cleanup candidates with a visible safety rationale for each. Backend: shares the D02.05 candidate discovery (single implementation); ledger rows add a safetyTier (safe, review, protected) derived from explicit rules, with the rule shown. In-use files (open handles) are excluded or marked, never forced. Frontend: ledger with category, location, measured size, age, tier badge, per-row exclude, a total that equals the sum of included rows exactly. Safety: discovery only. Acceptance: fixture with safe, review and protected candidates plus an in-use file: tiers as specified; excluded rows leave the total; ledger sum equals disk measurement of the fixture.
D08.02 — Quarantine Review & Safety Vault
• Objective: review the plan and move approved candidates into the vault. Backend: buildCleanupPlan → previewCleanup (dry run through the same code path) → approve(planHash) → quarantine(planId, token); bounded concurrency, progress by measured counts and bytes, cancellation with per-item atomicity, restart reconciliation. Frontend: review table with item provenance, tier, size; a persistent banner Quarantine does not free space on this volume until purged when applicable; execution shows real counts; completion shows verified results and the receipt. Safety: H (moves user-visible data). Acceptance: disposable tree: all approved items end in the vault with matching hashes and manifest entries; protected item planted in the plan is rejected by Main; cancel at 50% leaves a consistent vault; kill/relaunch reconciles; same-volume figure shows 0 freed; cross-volume path verifies before removing the source.
D08.03 — Cleanup Recovery Console & Journal
• Objective: restore quarantined items and read the full journal. Backend: previewRestore(itemIds) (feasibility per item: parent exists, path free, hash intact), restore(itemIds, consent), partial-restore receipts, idempotent re-run. Frontend: console listing vault items with restorable state and reason when not restorable, restore preview, journal viewer with filters. Safety: H; never overwrites. Acceptance: restore returns bytes identical to the quarantined original; occupied original path → collision strategy applied; corrupted vault item detected by hash and reported, not restored silently; restoring twice is idempotent.
D08.04 — Quarantine Vault File Inspector
• Objective: inspect one vault item before deciding. Backend: read-only dossier from the manifest and the vault file (size, hash verification on demand, original path, attributes, quarantined-at, retention deadline); content preview only for safe types under size limits and never executes anything. Frontend: inspector with original-versus-vault facts, hash verify button with measured progress, restore/purge actions that route to D08.03/D08.02 with consent. Acceptance: tampered vault file fails verification and is flagged; preview of a non-previewable type is refused with a reason.
D08.05 — Space Savings Breakdown & Calculator
• Objective: compute honest savings for a draft plan. Backend: from measured candidate sizes, computes (a) bytes affected, (b) bytes freed immediately given the chosen operation class and volume relation, (c) bytes freed after future purge, grouped by category and volume; hardlinks and shared extents counted once where the provider reports them. Frontend: breakdown drawn from those figures with the three numbers stated side by side; no rounded-up claims. Acceptance: same-volume quarantine plan gives (b) = 0; PURGE plan gives (b) = (a) within filesystem accounting limits noted in the UI; figures reconcile with D07.10.
D08.06 — Recycle Bin Multi-Volume Inspector
• Objective: see and manage the Recycle Bin per volume. Backend: enumerates Recycle Bin items through the shell facility (name, original path, deleted-at, size) per volume; read-only by default. Emptying or restoring is performed through the OS facility only as an approved, journaled operation; KNOuX does not parse or edit Recycle Bin internal files directly. Frontend: per-volume totals, item list, estimated reclaim equal to the sum of item sizes (real). Acceptance: shell-provider fixture with two volumes reports exact totals; empty-bin action requires consent and records a receipt; permission failures are classified.
D08.07 — Dormancy & Unused Files Explorer
• Objective: find files untouched for a chosen period. Backend: index query on modified/created/last-access with an explicit caveat that Windows may not update last-access times; the UI shows which timestamp the dormancy is based on and offers modified-based as the reliable default. Excludes protected paths and system files. Frontend: age histogram and ranked list with real dates; handoff to Cleanup preview as a draft only. Acceptance: boundary dates (exactly N days) behave consistently; DST and time-zone correctness; files with future timestamps are listed separately.
D08.08 — Windows Update & Servicing Cache Gateway
• Objective: reclaim servicing-related space without damaging servicing. Backend: read-only sizing of the Update download cache and servicing stores; the only supported actions are those the OS itself provides (Disk Cleanup/servicing facilities, or stopping the update service and clearing the download cache) executed as allowlisted, elevated, consent-gated steps with service-state restoration and journaling; the component store (WinSxS) is never manually deleted; component-store cleanup, if offered, is only through the supported servicing command with its own output captured. Safety: H; requires elevation; reboot-pending state is detected and respected. Acceptance: simulated runner proves the exact command sequence, service restore in the failure path, and refusal when a reboot is pending; real execution only with explicit authorization.
D08.09 — Web Browser Profile Cache Inspector
• Objective: show browser cache footprint without touching private data. Backend: locates cache directories (cache, code cache, GPU cache, service-worker cache) by known layout per browser; reports sizes and dates (metadata only). It never reads cookies, history, passwords, tokens or local storage, and never opens browser databases. Clearing is limited to cache directories, as QUARANTINE or PURGE through the standard plan flow, and is blocked while the browser is running (process check), with an explicit message. Acceptance: fixture profile with decoy credential files proves zero reads of non-cache paths; running-browser fixture blocks the plan.
D08.10 — Log Retention & Dump Explorer
• Objective: find and manage logs and crash dumps by age and size. Backend: known log and dump locations (application logs the user authorizes, Windows Error Reporting archives, minidumps/memory dumps where readable) classified by type and age; a retention policy preview (keep newest N / newer than D days) computes what would be removed; execution via the plan flow; dumps flagged as may contain sensitive memory and never previewed or uploaded. Acceptance: policy previews are exact on fixtures; dump files are never opened; protected locations excluded.
D08.11 — Automated Cleanup Schedule Composer
• Objective: compose a recurring cleanup definition. Backend: produces an automation workflow definition for D13.06 with explicit scope, rule set, operation class (QUARANTINE only unless a PURGE preapproval is created separately), retention, quiet hours and power gating; no schedule becomes active without an approved, hash-bound preapproval renewed on a stated interval; a stale scope or rule hash makes a scheduled run skip and log, not run. Frontend: composer with next-run preview computed by the recurrence engine and an honest Draft / Active state. Acceptance: changing a rule invalidates the preapproval; missed runs follow the stated policy; draft schedules never execute.
D08.12 — Before/After Cleanup Report Studio
• Objective: a factual report of a cleanup. Backend: assembles a report from receipts and measured volume samples taken before and after (real volume used/free, bytes quarantined, bytes purged, items failed); the report states quarantine-versus-freed separately and includes the receipt references. Frontend: report view with export to PDF/HTML/Markdown; no invented savings. Acceptance: report numbers equal receipt sums and sampled volume values; a failed or cancelled cleanup is reported as such.
20. Domain 09 — Startup (12 entries)
Startup discovers, explains and (with consent) changes what launches at boot and logon. It separates measured boot impact from estimated suggestions, and it never disables a critical entry automatically.
20.1 Autorun sources (REQUIRED enumerators, each independently reported)
Source
Scope
Notes
Registry Run and RunOnce
Machine (HKLM, including the 32-bit view) and user (HKCU)
Command line parsed into executable and arguments; expanded environment variables recorded alongside the raw value
StartupApproved state keys
Machine and user, Run and StartupFolder
Source of truth for enabled/disabled as Windows itself applies it
Startup folders
All-users and per-user
Shortcuts resolved to targets without executing them
Scheduled tasks with logon/boot triggers
Per task
Read through the Task Scheduler interface; trigger, delay, run-as account, enabled state
Services with automatic or delayed-automatic start
SCM
Shared with D12 so one SCM enumeration serves both
Other documented autorun locations Windows still honors (for example Winlogon values, shell extensions)
Read-only reporting
Listed as observed only; KNOuX does not edit them unless a later specification adds typed, verified support
An enumerator that fails (permission, missing provider) is shown as a failed source in D09.04. It is never represented as an empty source.
20.2 Shared Startup rules (REQUIRED)
• Classification catalog. Each entry gets a protection class: critical (Windows or security components, drivers' autoruns on the protected list) → read-only; system (Microsoft-signed, non-critical) → change requires explicit consent with warning; third-party → normal consent. Classification uses the signature provider plus an explicit allowlist/denylist file shipped with the application and versioned.
• Supported change mechanisms only. Enable/disable uses the same mechanism Windows' own Startup settings use (the StartupApproved values) for registry and folder entries, and the task's enabled flag for scheduled tasks, so changes are exactly reversible. Deleting autorun entries is not a default action.
• Backup before change. The previous state (raw values, approved bytes, task XML hash) is stored in the rollback record before any change.
• Verify after change. Re-read the source and confirm the intended state. A mismatch is recorded as VERIFY_FAILED and the rollback record is offered.
• Privilege. Machine-scope changes need elevation; the UI shows needs-elevation and does not attempt silent escalation.
• Journal. Every proposed and applied change is journaled with before/after state, actor action, consent token reference and verification result.
• Boot impact honesty. Measured impact comes from Windows boot/diagnostic performance events when present and carries the boot index and measurement time; otherwise the metric is unavailable. Suggestions (for example, delay this entry) cite entry attributes and are labeled estimate: not measured.
20.3 Per-service contracts
D09.01 — Windows Boot Autorun Register
• Objective: one complete, accurate list of autoruns. Backend: merges all enumerators into normalized entries {id, name, command, target, publisher, signatureState, source, scope, enabled, protectionClass, firstSeen, lastChanged}; stable IDs derive from source plus key/path plus value name so they survive restarts. Frontend: sortable table with source icons, publisher, signature badge, enabled toggle (opens D09.02, never applies immediately), inspector with raw and parsed command. Safety: read-only. Acceptance: registry/task/folder fixtures across both scopes produce the exact expected entries; 32-bit view entries appear once and labeled; stale command targets are flagged target missing.
D09.02 — Autorun State Change Preview
• Objective: show exactly what a change will do, before it does it. Backend: previewChange(entryIds, desiredState) returns per-entry: current state, target state, mechanism, required privilege, protection class warnings, expected post-state and a reversible rollback record preview. No effect. Frontend: before/after panel, warnings for critical (change blocked) and system, elevation indicator, Stage button (adds to D09.11) and Apply (single-entry) that requires consent. Acceptance: preview equals the later applied outcome on fixtures; critical entries cannot be staged.
D09.03 — Startup Restoration & Rollback
• Objective: undo startup changes. Backend: rollback(recordId) restores recorded prior state, verifies, journals; handles drift (the entry changed since — reported and not forced). Frontend: list of rollback records with feasibility and drift notes; confirm dialog with the exact before/after. Safety: M. Acceptance: disable then rollback returns exact original StartupApproved bytes; drift scenario reports DRIFTED and requires explicit re-approval; idempotent.
D09.04 — Autorun Source Coverage Map
• Objective: show which sources were examined and how completely. Backend: per source: status (ok, partial, denied, unsupported), counts, errors, provider, time. Frontend: coverage map with exact statuses; a failed source is visibly failed. Acceptance: denied registry hive fixture shows denied, never zero entries; totals equal D09.01 counts per source.
D09.05 — Startup Change Audit Journal
• Objective: read-only history of every startup change (by KNOuX) plus externally observed changes between inventories. Backend: journal entries from D09.02/03/11/12; an inventory differ compares successive snapshots and labels differences as observed outside KNOuX with the snapshot times (it does not claim who changed them). Acceptance: an external change appears as observed with correct times; KNOuX changes show full before/after.
D09.06 — Keyboard-First Autorun Query Console
• Objective: a fast, scriptless query surface. Backend: a small typed query language (field filters: source:, publisher:, enabled:, class:, signed:, free text) evaluated over the register; no code execution, no shell; results identical to the equivalent GUI filter. Frontend: console input with history, completion, keyboard-only actions that open previews (never apply). Acceptance: query-to-result equivalence tests; malformed queries produce parse errors with positions; no query can trigger a change.
D09.07 — Boot Sequence Impact Timeline
• Objective: a timeline of measured boot and logon phases. Backend: reads Windows boot/diagnostics performance events when available (boot, main path, post-boot, per-app degradation records), with boot index and timestamp; separates measured per-entry delay from nothing else. If the log is disabled or empty the timeline says so, offers instructions to enable it only as documentation, and shows no numbers. Frontend: timeline drawn from event durations only; one clearly labeled panel for estimated suggestions kept visually separate and marked unmeasured. Acceptance: injected event log fixture reproduces durations exactly; empty log shows unavailable.
D09.08 — Service Boot Policy Matrix
• Objective: how services start. Backend: shared SCM enumeration: start type (boot, system, automatic, delayed, manual, disabled), account, dependencies, trigger-start flag; protection class from the shared catalog. Frontend: matrix of services by start type and class; handoff to D12 for any change (this service never changes policy). Acceptance: counts equal D12.01; trigger-start services labeled so; protected services marked.
D09.09 — Logon Scheduled Task Timeline
• Objective: tasks that run at logon/boot. Backend: task enumeration with trigger type, delay, repetition, last/next run time and last result as reported by the scheduler, run-as account, enabled flag; hidden and Microsoft tasks classified. Frontend: timeline from trigger delays and reported run times; no invented schedules. Acceptance: fixture tasks with delays and repetition render at the correct offsets; disabled tasks marked; unreadable tasks listed as such.
D09.10 — Delayed Launch Planner
• Objective: plan a delayed start for a selected entry. Backend: creates a plan only: replace-in-place by a scheduled-task trigger with a fixed delay while disabling the original autorun, expressed as a two-step typed change with its own rollback record; execution runs through the standard preview/consent/verify flow. The delay value is the user's choice with estimate wording; KNOuX does not claim a measured saving. Safety: M; critical entries ineligible. Acceptance: plan generates a task definition and a disable step that apply and roll back as a unit; failure of step two rolls back step one.
D09.11 — Autorun Batch Staging Tray
• Objective: assemble several changes and apply them together. Backend: staged set persisted with a set hash; applying requires one approval bound to the hash; items execute sequentially with per-item verification and continue-on-error semantics; a single batch receipt references each item's rollback record. Frontend: tray with per-item state, conflicts (two changes to the same entry collapse with a note), apply and clear. Acceptance: hash changes when the set changes; a blocked critical item prevents staging; partial failure leaves a truthful receipt.
D09.12 — Batch Recovery & Mass Rollback Workspace
• Objective: reverse a batch. Backend: previewBatchRollback(receiptId) computes feasibility per item and drift; rollbackBatch executes feasible items, reports the rest, journals everything; never forces drifted items. Frontend: per-item before/after/drift view, partial-completion result. Acceptance: batch apply then rollback restores the full original snapshot (hash of normalized register equals the original); a drifted item is reported and skipped; interrupted rollback resumes after restart.
21. Domain 11 — Repair Lab (12 entries)
Repair Lab executes allowlisted Windows diagnostics and repairs at the operation-contract level. It is never an arbitrary command console, and no AI-generated command text ever reaches a process.
21.1 Operation contract (REQUIRED for every operation)
Field
Requirement
operationId
Fixed catalog identifier; the renderer sends only this plus typed parameters
Executable and arguments
Built in Main from the catalog entry and validated parameters; absolute system path to the executable, no PATH search, no shell
Windows version support
Declared supported builds; unsupported builds report unsupported-platform
Elevation
Declared per operation; detected before start; never silently escalated
Risk class
read, reversible, disruptive, heavy (long-running or reboot-likely)
Preview
Exact command, expected effects, what will be restarted or reset, rollback options and limits
Consent
Operation-specific, time-limited token; disruptive and heavy classes require typing-free explicit confirmation of the exact operation name
Execution
Spawn with captured stdout/stderr (decoded with the correct console code page), exit code, duration, timeout, cancellation (graceful then forced, with child-tree cleanup)
Result interpretation
Per-operation parser maps output and exit code to HEALTHY, REPAIRED, REPAIRABLE, NOT_REPAIRABLE, REBOOT_REQUIRED, FAILED, CANCELLED, UNKNOWN, each with the evidence line it came from
Verification
A follow-up read-only check where one exists (for example re-run verify mode)
Journal
Everything above is stored in an append-only receipt
Recovery statement
An honest statement of what can and cannot be undone (see 21.3)
Parsers are tested against recorded real outputs for the supported Windows builds and languages. Localized OS output must not cause a misclassification; where an output cannot be classified the result is UNKNOWN with raw output attached, never a guess.
21.2 Test safety (REQUIRED)
Automated tests use a simulated process runner that replays recorded output and exit codes, plus disposable VMs for end-to-end behavior. Read-only diagnostics may run on real hosts. Disruptive and heavy operations never run against the owner's machine without explicit, operation-specific authorization recorded in the evidence; the evidence labels the run real or simulated.
21.3 Recovery limits (stated in the UI)
DISM and SFC repairs are not reversible by KNOuX; the mitigation is a restore point created beforehand where the system allows it. A Winsock or TCP/IP reset discards custom configuration; KNOuX records the pre-reset configuration for reference and re-entry, and states that it cannot guarantee automatic restoration of third-party layered providers.
21.4 Per-service contracts
D11.01 — DISM CheckHealth Diagnostic Console
• Operation: DISM /Online /Cleanup-Image /CheckHealth. Class: read (reports flagged corruption state without scanning). Elevation: required for DISM online operations; detect and show needs-elevation. Parse: No component store corruption detected / The component store is repairable / not repairable → HEALTHY / REPAIRABLE / NOT_REPAIRABLE. Frontend: console with live captured output, result chip with the evidence line, history. Acceptance: recorded outputs for each outcome parse correctly in each supported language fixture; cancel terminates the child tree; non-elevated launch reports needs-elevation without running.
D11.02 — DISM ScanHealth 7-Stage Console
• Operation: DISM /Online /Cleanup-Image /ScanHealth. Class: heavy-read. Stages: the seven stages are derived only from real DISM progress output and phase markers (for example start, image mount/scan, component analysis, completion); where the output provides a percentage, it is shown as measured; stages that cannot be observed are shown as not reported, never faked. Frontend: stage list that advances only on observed output, a measured percentage when printed, cancel. Acceptance: recorded progress transcripts drive the stage UI exactly; no stage advances on a timer; result classification as in D11.01.
D11.03 — DISM RestoreHealth System Repair Wizard
• Operation: DISM /Online /Cleanup-Image /RestoreHealth (optionally with a user-chosen, validated /Source). Class: heavy, disruptive. Wizard steps: read-only precheck (D11.01) → source choice (Windows Update default; local source path validated against the image index) → restore point attempt and status → consent → run → post-verify (CheckHealth) → receipt. Network-dependent: absence of connectivity is reported before start. Reboot-pending state detected and respected. Acceptance: simulated runner covers success, repairable-but-source-missing, network failure, cancel mid-run (honest state unknown with instructions to run verify), reboot-required; wizard cannot skip consent or precheck.
D11.04 — SFC VerifyOnly File Integrity Shield
• Operation: sfc /verifyonly. Class: read (no repair). Parse: did not find any integrity violations / found integrity violations / could not perform the requested operation with CBS log reference. The CBS log is read only to extract the relevant lines for the receipt, with path redaction in exports. Acceptance: recorded outputs per language; violations result links to D11.05 as a recommendation, never starts it.
D11.05 — SFC ScanNow Protected File Repair Wizard
• Operation: sfc /scannow. Class: heavy, disruptive. Wizard: precheck via D11.04 result, recommended DISM health check first when component store is not verified healthy, restore point attempt, consent, run, post-verify with /verifyonly, receipt including CBS.log excerpt lines. Cannot run on a reboot-pending system without a visible warning and a second confirmation. Acceptance: simulated outcomes: no violations, repaired, repaired after reboot, unrepairable files list; ordering enforced by the wizard.
D11.06 — DNS Resolver Cache Refresh Preview
• Operation: read the resolver cache (ipconfig /displaydns or the DNS client cache API) and preview ipconfig /flushdns. Class: read for preview; reversible for flush (cache repopulates). Frontend: cache entry count and sample (names and TTLs), what flushing does and does not do; flush button requires consent and records before/after counts. Acceptance: fixture cache parsed correctly (including localized headers); flush verified by count drop; non-elevated behavior documented per Windows build.
D11.07 — Winsock Catalog Disruption Risk Review
• Operation: read the Winsock catalog (netsh winsock show catalog) and analyze it. Class: read; the reset (netsh winsock reset) is not executed by this service, which only reviews risk. Backend: lists layered service providers, flags non-Microsoft providers (VPN, security products) with publisher via signature, explains that a reset removes them; exports the catalog for reference. Frontend: risk summary with the actual providers found; a handoff to D10.24 for the gated reset. Acceptance: fixture catalogs with and without third-party LSPs yield the correct risk text; export equals the parsed catalog.
D11.08 — TCP/IP Stack Reset Configuration Diff
• Operation: read current IP configuration and compute a diff of what netsh int ip reset would change (static addresses, DNS servers, gateways, interface metrics, custom MTU, bindings), derived from documented behavior and the real current configuration, labeled predicted. Class: read. Execution of the reset is performed only from D10.24 after consent, with the pre-reset snapshot saved to the receipt. Acceptance: fixtures with static and DHCP interfaces predict exactly the documented reset effects; snapshot export round-trips.
D11.09 — System Repair Audit Journal
• Objective: a read-only journal of all repair receipts. Backend: queries receipts by operation, outcome, date, elevation; full detail view with raw output, exit code, duration, parser evidence line, verification result, and the recovery statement. Export with redaction policy. Acceptance: every executed or simulated-labeled operation appears once; raw output integrity verified by receipt checksum; a tampered receipt is flagged.
D11.10 — Windows Troubleshooter Gateway
• Operation: launch the built-in troubleshooters through the supported facility for the installed Windows build, from an allowlist of troubleshooter identifiers (for example network, Windows Update, audio, printer). KNOuX launches and records the launch; it does not claim to know the troubleshooter's outcome unless the OS exposes a result. Class: reversible/diagnostic. Frontend: gateway cards for available troubleshooters on this build; unavailable ones are unsupported-platform with the reason (the facility has changed across Windows versions). Acceptance: allowlist enforced (unknown ID rejected); receipts record launch time and identifier only.
D11.11 — System Restore Point Inspector
• Operation: enumerate restore points (description, creation time, type, sequence number) and report whether System Protection is enabled per volume and the configured disk-space limit. Creating a restore point (Checkpoint-Computer or the supported API) is available as a gated action, subject to the system's frequency limit; deletion is out of scope. Frontend: list with real values, an honest System Protection is off state with the consequence for D11.03/05. Acceptance: fixture enumeration; creation outcome including the recently created throttle is reported truthfully.
D11.12 — Windows Update Servicing Reset Wizard
• Operation: a staged, allowlisted sequence for resetting Windows Update components, each step shown and consented as a group: stop the update-related services in dependency order → rename the download cache directory (not delete) to a timestamped backup name → re-register nothing beyond documented steps → restart services → verify service states and run a scan trigger check where supported. Class: heavy, disruptive. Safety: state capture of service start types and states first; failure path restores service states; reboot-pending respected; each step journaled. Acceptance: simulated runner proves the exact sequence, step failure rollback, and that nothing is deleted; real execution only with explicit authorization on a VM or the owner's explicit consent.
22. Domain 12 — Services Commander (12 entries)
Services Commander integrates the Windows Service Control Manager (SCM). Observation is the primary purpose; the few action services are consent-gated, verified and reversible. Read-only diagnostic services are complete when they observe accurately.
22.1 Shared Services rules (REQUIRED)
• One SCM enumeration. A single provider enumerates services (name, display name, description, state, type, start type, delayed-start flag, trigger-start flag, account, binary path, dependencies and dependents, process ID, failure actions, last known exit code) and serves D09.08, D10.11 and D12. Access-denied queries yield a partial record with the denied fields labeled.
• Protection catalog. A versioned catalog classifies services: core (Windows components whose stop or reconfiguration can destabilize the system or security, including the SCM-dependent core, RPC, DCOM launcher, event log, security and authentication services, crypto, Windows Defender/security services, network stack, Windows Update-critical), protected-third-party (security products, drivers), standard. core and protected-third-party are read-only: no start, stop, restart or policy change is offered, enforced in Main. The catalog ships with the application, is versioned, and unknown services default to standard only when signed by Microsoft and not in a denylist; otherwise they require extra warning.
• Allowed actions. Start, stop, restart, and change start type (automatic, delayed-automatic, manual, disabled) on non-protected services only, with dependency analysis, a dry-run preview, consent, elevation, execution via the SCM API, a bounded wait for the target state with timeout, post-verification and a journal record that includes prior configuration for rollback.
• Never delete a service, change its binary path, account or security descriptor, or edit failure actions (observation only) unless a later specification adds typed, verified support.
• Postcondition. Every action verifies the resulting state and start type by re-querying; a mismatch is VERIFY_FAILED with the rollback offered.
• Dependency semantics. Stopping a service stops dependents; the preview lists exactly which running dependents would stop, and the action is blocked if any dependent is protected.
22.2 Per-service contracts
D12.01 — Windows SCM Service Register
• Objective: a complete, accurate register. Backend: the shared enumeration; stable IDs by service name; snapshot time shown. Frontend: sortable and filterable table with state, start type, account, protection class badge, process link (D10.03), inspector. Safety: read-only. Acceptance: provider fixture with delayed-auto, trigger-start, per-user and shared-process services; counts equal ground truth; denied fields labeled; refresh updates states.
D12.02 — Service State Change Review & Guard
• Objective: safely start, stop or restart a service. Backend: previewServiceAction (dependents, protection class, privilege, expected state), applyServiceAction(plan, consent) with bounded wait and verification, journal. Pending stop/start states and timeouts are reported honestly. Frontend: review panel with dependency impact list, warnings, elevation status, consent, live state transitions from real queries. Safety: H; core and protected-third-party blocked. Acceptance: simulated SCM: success, slow stop with timeout, dependent blocks action, protected service refused in Main (UI bypass attempt rejected), access denied reported, post-state verified.
D12.03 — Service Startup Policy Undo Journal
• Objective: change start type and undo it. Backend: previewStartTypeChange, applyStartTypeChange, undoStartTypeChange(recordId) with drift detection (the policy changed since). Records prior start type and delayed flag. Frontend: journal with per-record undo feasibility and drift notes. Safety: H for disabled on services with dependents (blocked if dependents are protected). Acceptance: change then undo restores the exact original (type and delayed flag); drift handled; idempotent; restart-safe.
D12.04 — Interactive Service Dependency Network
• Objective: see how services depend on each other. Backend: graph from real dependency lists with node attributes (state, class); bounded graph size via focus-and-neighbors queries rather than rendering all nodes at once. Frontend: interactive network centered on a selected service, depth control, click-to-recenter, keyboard navigation, textual alternative listing for accessibility. Acceptance: edges equal the SCM dependency data exactly; cycles (rare, but check) handled; 500-node fixture stays responsive through neighbor-limited rendering.
D12.05 — Protected Windows Core Services Atlas
• Objective: explain which services are protected and why. Backend: the protection catalog presented with, for each entry, the reason, consequences of tampering, and the catalog version; services present on this machine are marked, absent ones listed as not installed. Frontend: atlas grouped by function with honest scope note (a catalog, not a security guarantee). Acceptance: catalog entries match the guard's enforcement exactly (one source of truth, tested by a contract test); version shown.
D12.06 — SCM Keyboard-First Query Console
• Objective: fast, typed service queries. Backend: the same typed query approach as D09.06 over the register (state:, start:, class:, account:, depends:, free text); no code execution; actions open previews and never apply. Acceptance: query-to-GUI-filter equivalence; parse errors positioned; no query path reaches an action without consent.
D12.07 — Startup Policy Distribution Analytics
• Objective: how start types are distributed. Backend: aggregation by start type, class, account and signer from the snapshot. Frontend: distribution drawn from real aggregates and a table; click filters the register. Acceptance: totals reconcile to D12.01; unknown signers grouped as unknown, not hidden.
D12.08 — Service Transition State History
• Objective: how service states changed over time. Backend: two sources, always labeled: (a) KNOuX's own periodic state samples with timestamps, and (b) Service Control Manager events from the Event Log (state-change and unexpected-termination events) read with the Event Log API. Gaps between samples are shown as gaps. No inferred transitions. Frontend: per-service timeline with source labels; filter by service and event type. Acceptance: injected event log and sample fixtures render exactly; the sampler's off periods show as gaps; events are never attributed to a cause the log does not state.
D12.09 — Cascade Service Dependency Impact Tree
• Objective: show what a stop or disable would cascade to. Backend: a tree of running dependents (and optionally start-type dependents) computed from the graph, with protection class per node and a verdict blocked / needs review / ok derived by an explicit rule. Frontend: tree with counts and per-node reasons; feeds D12.02's preview (one implementation). Acceptance: tree equals the dependent graph; blocked verdict whenever any protected dependent is running; verdict rule shown.
D12.10 — SCM Fault Investigation & Diagnostics
• Objective: investigate failing services. Backend: failure actions (as configured, read-only), last exit code and service-specific exit code, recent SCM/Event Log failure events (timeouts, crashes, dependency failures), dependency health, binary existence and signature state, account validity hints. Findings cite exact events and values; no root-cause claims beyond what the events state. Frontend: per-service diagnosis cards with evidence expansions and links to D10.02 events. Acceptance: fixture failure scenarios produce findings that cite the right events; absence of events yields no failure evidence found, not a clean bill of health.
D12.11 — Startup Policy Configuration Diff
• Objective: diff start-type policy between two points. Backend: compares two snapshots (current vs earlier KNOuX snapshot, or vs an imported baseline file in the documented schema) and lists changes by service with before/after; shows which differences KNOuX itself caused (journal match) and which were observed externally. Frontend: diff table with filters and an export; revert actions open D12.03 previews. Acceptance: fixture snapshots yield exact diffs; import of a malformed baseline is rejected with positioned errors; attribution only where the journal proves it.
D12.12 — Shared-Process svchost.exe Monitor
• Objective: understand which services share each svchost.exe. Backend: maps processes to hosted services using the SCM process-to-service relationship; per-process CPU, working set, handle/thread counts from the process provider with sample times; services in the same process are grouped; per-service resource figures are shown only where the OS isolates them (separated service hosting) and otherwise labeled shared process total. Frontend: grouped list with honest attribution. Acceptance: fixture with shared and split-hosted services shows correct groups; no per-service CPU appears for services inside a shared host; a missing process mapping reads as unavailable.