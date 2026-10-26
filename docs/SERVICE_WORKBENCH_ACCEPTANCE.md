# KNOuX — Service Workbench UI & Actual Action Acceptance

This is a starting audit inventory, **NOT TEST EVIDENCE** and not an assertion of delivered workbenches.
Source of advertised scope: docs/SERVICE_CAPABILITY_MATRIX.md (181 entries). Existing service/surface IDs: docs/SERVICE_REGISTRY_EVIDENCE.md (150 entries). Counts overlap; not 331 distinct engines. Use missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md and missions/15_REAL_SERVICE_ACTIVATION_MISSION.md.

A service is accepted only when its actual distinct dock/expanded workbench opens with real meaningful user controls; applicable native action provider has effectful disposable-fixture proof and consent/recovery; EN/AR, RTL, dark/light, 1366/1672/1920, keyboard, dev+packaged Electron pass. Until inspected, all statuses below remain AUDIT_REQUIRED.

## Current integration checkpoint (2026-10-27)

The reusable `ServiceWorkbenchHost` is implemented and Files' 12 domain tools open inside it. Side mode was verified with the originating Files register still visible; expanded mode stays inside the main content and leaves the Files footer visible. The selected file, filters and table selection remain in FilesPage state across mode switches. Files mutation apply/undo remain BLOCKED; all other Files rows are measured read-only. Studio side/expanded integration is not yet complete.

| Mission | Advertised entry | Displayed purpose | Mapped registry ID | Dock/expanded | Dedicated workbench | Actual buttons/selection | Read/native action provider | Risk/approval & undo | E2E/visual evidence | Verified status |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | mission-01-01 | Smart Scan | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-02 | Organize Files | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-03 | Applications | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-04 | Storage | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-05 | Cleanup | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-06 | Startup Control | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-07 | System Live Pulse | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-08 | Repair Lab | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-09 | Global Search | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-10 | KNOuX Insight | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-11 | Recent Activity | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 01 | mission-01-12 | Pending Safe Actions | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-01 | Quick Scan | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-02 | Deep Scan | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-03 | Duplicate Finder | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-04 | Large Files | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-05 | Junk Cleaner | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-06 | Privacy Trace Check | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-07 | Startup Impact | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-08 | App Health | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-09 | System Health Pulse | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-10 | Smart Recommendations | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-01 | Sources | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-02 | Visual Library | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-03 | Collections | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-04 | Organization Builder | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-05 | Destinations | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-06 | Plan Review | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-07 | Execution | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-08 | History & Undo | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-09 | Suggestions | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-01 | Google Sheets | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-02 | Gmail | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-03 | Google Tasks | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-04 | Google Forms | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-05 | Google Contacts | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-06 | Google Calendar | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-07 | Google Picker | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-08 | Google Slides | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-09 | Google Chat | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-10 | Google Classroom | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-inventory | Installed Applications Register | app-inventory | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-identity | App Identity & Authenticode Trust | app-identity | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-search | Multi-Parameter Software Search | app-search | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-publisher | Publisher Intelligence & Reputation | app-publisher | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-recent | Recently Changed Applications | app-recent | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-uninstall-queue | Bulk Uninstall Queue & Batch Manager | app-uninstall-queue | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-leftovers | Orphaned Leftover Trace Analysis | app-leftovers | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-updates | Software Update Center | app-updates | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-size | Software Storage Footprint Treemap | app-size | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-store-packages | Package Center & WinGet Browser | app-store-packages | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-associations | File Extension & Protocol Matrix | app-associations | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-startup-impact | Software Boot Impact Analyzer | app-startup-impact | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-downloads-inventory | Downloads Folder Inventory | file-downloads-inventory | SIDE + EXPANDED | FilesServiceFocus embedded | Add folder, Rescan, Plan in Studio, real source/category/recent lists | measured Files overview (read-only) | read-only; plan handoff | dev+packaged smoke filesWorkbenchOk; files-workbench-dev/expanded | MEASURED_READ_ONLY |
| 06 | file-organize-preview | Visual Rule Builder & Organization Studio | file-organize-preview | SIDE + EXPANDED | FilesServiceFocus embedded | Open Studio Plan Review; no execution | Studio preview plan (read-only) | preview only; no apply | dev+packaged smoke filesWorkbenchOk | PARTIAL |
| 06 | file-organize-apply | Organization Staging & Change Review | file-organize-apply | SIDE + EXPANDED | FilesServiceFocus embedded | Explicit BLOCKED explanation; no apply control | none | blocked pending write gate/approval | dev+packaged smoke filesWorkbenchOk | BLOCKED |
| 06 | file-organize-undo | File Organization Undo Timeline | file-organize-undo | SIDE + EXPANDED | FilesServiceFocus embedded | Explicit BLOCKED explanation; no undo control | none | blocked pending journal/approval | dev+packaged smoke filesWorkbenchOk | BLOCKED |
| 06 | file-empty-folders | Sparse Empty Folder Explorer | file-empty-folders | SIDE + EXPANDED | FilesServiceFocus embedded | Scan empty folders; bounded results | measured Files empty-folder query | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 06 | file-hash | Cryptographic Hash Inspector | file-hash | SIDE + EXPANDED | FilesServiceFocus embedded | Compute SHA-256 for selected file | measured Files hash | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 06 | file-search | Instant Everything-Style File Search | file-search | SIDE + EXPANDED | FilesServiceFocus embedded | Native filters, sort, 200-row ledger, selection | measured Files query | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 06 | file-type-map | File Format Type Distribution | file-type-map | SIDE + EXPANDED | FilesServiceFocus embedded | Extension distribution from measured overview | measured Files overview | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 06 | file-recents | Recent File Timeline Histogram | file-recents | SIDE + EXPANDED | FilesServiceFocus embedded | Recent measured rows | measured Files overview | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 06 | file-largest | Ranked Large File Explorer | file-largest | SIDE + EXPANDED | FilesServiceFocus embedded | Largest measured rows | measured Files overview | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 06 | file-metadata | Deep File Metadata & Attributes Dossier | file-metadata | SIDE + EXPANDED | FilesServiceFocus embedded | Selected file metadata/attributes/Zone.Identifier | measured Files metadata | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 06 | file-provenance | Trust Evidence & Provenance Board | file-provenance | SIDE + EXPANDED | FilesServiceFocus embedded | Source/coverage/last scan evidence | measured Files overview | read-only | dev+packaged smoke filesWorkbenchOk | MEASURED_READ_ONLY |
| 07 | storage-disks | Volume Bays & Partition Manager | storage-disks | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-large-files | Heavy-File Storage Ledger | storage-large-files | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-duplicates | Byte-Exact Duplicate Hash Groups | storage-duplicates | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-treemap | Interactive Storage Space Treemap | storage-treemap | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-top-folders | Folder Ranking Waterfall | storage-top-folders | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-filetypes | Storage Byte Distribution by Category | storage-filetypes | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-scan-overview | Drive Coverage & Scan Dashboard | storage-scan-overview | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-fragmentation | Drive Optimization & TRIM Dossier | storage-fragmentation | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-smart | Disk Reliability & S.M.A.R.T. Health | storage-smart | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-reclaim | Storage Reclaim Planner & Basket | storage-reclaim | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-history | Capacity Trend Timeline | storage-history | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-removable | Removable USB & External Volume Dock | storage-removable | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-temp-preview | Temporary Files Candidate Safety Ledger | cleanup-temp-preview | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-temp-quarantine | Quarantine Review & Safety Vault | cleanup-temp-quarantine | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-temp-undo | Cleanup Recovery Console & Journal | cleanup-temp-undo | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-quarantine-list | Quarantine Vault File Inspector | cleanup-quarantine-list | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-estimate | Space Savings Breakdown & Calculator | cleanup-estimate | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-recycle | Recycle Bin Multi-Volume Inspector | cleanup-recycle | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-unused | Dormancy & Unused Files Explorer | cleanup-unused | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-update-cache | Windows Update & Servicing Cache Gateway | cleanup-update-cache | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-browser-cache | Web Browser Profile Cache Inspector | cleanup-browser-cache | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-logs | Log Retention & Dump Explorer | cleanup-logs | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-schedule | Automated Cleanup Schedule Composer | cleanup-schedule | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-reports | Before/After Cleanup Report Studio | cleanup-reports | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-overview | Windows Boot Autorun Register | startup-overview | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-disable | Autorun State Change Preview | startup-disable | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-restore | Startup Restoration & Rollback | startup-restore | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-sources | Autorun Source Coverage Map | startup-sources | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-journal | Startup Change Audit Journal | startup-journal | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-filter | Keyboard-First Autorun Query Console | startup-filter | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-impact | Boot Sequence Impact Timeline | startup-impact | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-services | Service Boot Policy Matrix | startup-services | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-tasks | Logon Scheduled Task Timeline | startup-tasks | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-delay | Delayed Launch Planner | startup-delay | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-batch | Autorun Batch Staging Tray | startup-batch | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-undo-all | Batch Recovery & Mass Rollback Workspace | startup-undo-all | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-health-check | System Pulse Overview Console | system-health-check | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-events | Windows Event Log Severity Ledger | system-events | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-processes | Active Process Register & Resources | system-processes | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-signatures | System Binary Certificate Inspector | system-signatures | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-uptime | System Boot & Session Clock Timeline | system-uptime | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-perf | Live Performance Pulse Charts | system-perf | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-drivers | Device Driver Inventory & Signatures | system-drivers | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-logs | Event Log Channel Explorer | system-logs | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-resources | Top Resource Consuming Processes | system-resources | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-autostart | App-to-Process Cross-Service Links | system-autostart | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-services-map | System Service Dependency Graph | system-services-map | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-timeline | Unified System Event Timeline | system-timeline | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-interfaces | Network Interfaces Console | network-interfaces | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-dns-config | DNS Resolver Configuration Dossier | network-dns-config | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-adapters | Network Hardware Atlas & NIC Rack | network-adapters | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-connectivity | Connectivity Diagnostic Step Sequence | network-connectivity | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-throughput | Real-Time Traffic & Throughput Chart | network-throughput | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-traceroute | Hop Route & Latency Visualizer | network-traceroute | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-topology | LAN Topology & Node Relationship Map | network-topology | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-ports | Active Socket & Port Explorer | network-ports | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-wifi | Wireless Wi-Fi Status & Signal Instrument | network-wifi | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-hosts | Windows Hosts File Inspector | network-hosts | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-proxies | Proxy & WinHTTP Configuration Graph | network-proxies | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-repair-link | Network Recovery & Reset Gateway | network-repair-link | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-inventory | Device Hardware Atlas & Components | hardware-inventory | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-battery | Battery Charge & Health Instrument | hardware-battery | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-cpu | Processor Architecture & Core Die | hardware-cpu | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-gpu | Graphics Adapter Bay & VRAM | hardware-gpu | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-memory | DIMM RAM Slots & Memory Layout | hardware-memory | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-cycles | Battery Wear & Cycle Count Ledger | hardware-cycles | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-thermal | Thermal Sensors & Temperature Board | hardware-thermal | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-disks | Physical Disk Drives & Bus Interface | hardware-disks | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-usb | USB Controller & Device Topology Tree | hardware-usb | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-display | Monitor Topology & Resolution Canvas | hardware-display | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-audio | Audio Endpoint Mixer & Devices | hardware-audio | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-health-report | Hardware Evidence & Diagnostic Report | hardware-health-report | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-component-check | DISM CheckHealth Diagnostic Console | repair-component-check | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-component-scan | DISM ScanHealth 7-Stage Console | repair-component-scan | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-component-restore | DISM RestoreHealth System Repair Wizard | repair-component-restore | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-files-verify | SFC VerifyOnly File Integrity Shield | repair-files-verify | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-files-repair | SFC ScanNow Protected File Repair Wizard | repair-files-repair | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-dns-flush | DNS Resolver Cache Refresh Preview | repair-dns-flush | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-winsock-reset | Winsock Catalog Disruption Risk Review | repair-winsock-reset | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-tcpip-reset | TCP/IP Stack Reset Configuration Diff | repair-tcpip-reset | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-history | System Repair Audit Journal | repair-history | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-troubleshooters | Windows Troubleshooter Gateway | repair-troubleshooters | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-restore-point | System Restore Point Inspector | repair-restore-point | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-update-reset | Windows Update Servicing Reset Wizard | repair-update-reset | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-inventory | Windows SCM Service Register | services-inventory | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-control | Service State Change Review & Guard | services-control | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-undo | Service Startup Policy Undo Journal | services-undo | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-dependencies | Interactive Service Dependency Network | services-dependencies | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-protected | Protected Windows Core Services Atlas | services-protected | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-search | SCM Keyboard-First Query Console | services-search | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-startup-report | Startup Policy Distribution Analytics | services-startup-report | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-state-history | Service Transition State History | services-state-history | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-dependents | Cascade Service Dependency Impact Tree | services-dependents | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-diagnose | SCM Fault Investigation & Diagnostics | services-diagnose | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-config | Startup Policy Configuration Diff | services-config | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-perf | Shared-Process svchost.exe Monitor | services-perf | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-smart-scan | Smart Scan Automated Workflow Flow | auto-smart-scan | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-schedule-manager | Weekly Automation Calendar & Task Manager | auto-schedule-manager | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-run-history | Automation Run History Timeline | auto-run-history | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-templates | Workflow Template Gallery & Library | auto-templates | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-schedule-plan | Recurrence Composer & Cron Preview | auto-schedule-plan | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-cleanup-plan | Safe Automated Cleanup Pipeline | auto-cleanup-plan | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-notify | Notification Channel Routing Board | auto-notify | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-quiet-hours | Quiet Hours 24-Hour Dial | auto-quiet-hours | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-battery-policy | Power-Aware Scheduler & Battery Gating | auto-battery-policy | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-retention | Artifact Retention Policy Timeline | auto-retention | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-export | Workflow Export & Schema Transfer | auto-export | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-backup-plan | Backup Flow & Verification Designer | auto-backup-plan | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-01 | Engine & Turbo Hardware | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-02 | AI Copilot & Provider Keys | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-03 | Google Workspace Hub | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-04 | Automated Protection & Guards | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-05 | Neon Glass Customization | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-06 | Language & Locale | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-07 | Profile Backup & System Restore | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-08 | AI Assistant Chat | UNMAPPED_RECONCILE | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |

**181 advertised mission entries; 132 exact ID matches in 150 evidence registry rows; 49 require ID reconciliation or justified aggregation.** No implementation evidence asserted.

Do not label 'Full UI parity' or 'Actual execution' without runtime proof. Read-only/informational services do not need fake mutation controls. Sensitive real-user system/account/file actions need explicit per-operation in-app authorization; tests use disposable resources only.
