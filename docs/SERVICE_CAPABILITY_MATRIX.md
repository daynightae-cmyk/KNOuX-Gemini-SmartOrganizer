# KNOuX — COMPLETE SERVICE CAPABILITY MATRIX

Source: each original service heading from the 14 domain mission files inside the SINGLE canonical repository.
This is a PRODUCT COMPLETION backlog, NOT a claim that these capabilities are implemented. Earlier CI and Qoder milestones remain historical scoped acceptance only.
Read missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md and missions/15_REAL_SERVICE_ACTIVATION_MISSION.md.

> Registry-ID evidence for 150 current surfaces (76 measured read-only, 57 partial, 10 consent-waiting, 4 unsupported, 1 implemented/tested, 2 blocked) is maintained in `docs/SERVICE_REGISTRY_EVIDENCE.md`. This mission-heading inventory is the authoritative product backlog; reconcile provisional mission-ID rows to registry IDs during Mission 15.

Classes are PROVISIONAL (A observation / B reversible action / C privileged or irreversible / D external connected); verify and correct during code/provider inspection.
Where a mission did not specify a service code, a provisional mission-ID-section-ID is used until reconciled with the actual service registry.
For EVERY row fill exact native provider, actual visible action, permission gate, result/postcondition, journal/rollback, Electron fixture E2E and the honest status. No passive dashboard or dry run counts as an actual mutation service.

| Mission | Service ID | Service intent | Proposed class | Old scope | Real provider | Actual executor/UI action | Consent & recovery | Fixture end-to-end | Actual product state |
|---|---|---|---|---|---|---|---|---|---|
| 01 | mission-01-01 | Smart Scan | B | HOME_DASHBOARD | measured scan history + KPI | deep link to Smart Scan; no execution from Home | read-only | test:home + dev/packaged smoke | PARTIAL — real scan KPI/insight; scan execution belongs to the service |
| 01 | mission-01-02 | Organize Files | B | HOME_DASHBOARD | none on Home | deep link to Studio with no file mutation | read-only | test:home + dev/packaged smoke | PARTIAL — measured Home card; organization execution belongs to Studio |
| 01 | mission-01-03 | Applications | B | HOME_DASHBOARD | real applications inventory KPI | deep link to Applications; no uninstall from Home | read-only | test:home + dev/packaged smoke | PARTIAL — measured count displayed; management belongs to Applications |
| 01 | mission-01-04 | Storage | A | HOME_DASHBOARD | system summary measured volumes | measured volume snapshot + link to Volume Atlas | read-only | test:home + dev/packaged smoke | MEASURED_READ_ONLY |
| 01 | mission-01-05 | Cleanup | B | HOME_DASHBOARD | scan reclaimable KPI + cleanup link | review link only; no deletion from Home | read-only | test:home + dev/packaged smoke | PARTIAL — measured candidate review; cleanup executor is separate |
| 01 | mission-01-06 | Startup Control | B | HOME_DASHBOARD | none on Home | deep link to Startup Control | read-only | test:home + dev/packaged smoke | PARTIAL — navigation and measured context; startup changes are separate |
| 01 | mission-01-07 | System Live Pulse | A | HOME_DASHBOARD | native system summary live sample | real CPU/memory/disk display + link | read-only | test:home + dev/packaged smoke | MEASURED_READ_ONLY |
| 01 | mission-01-08 | Repair Lab | B | HOME_DASHBOARD | none on Home | deep link to Repair Lab | read-only | test:home + dev/packaged smoke | PARTIAL — navigation only; repairs are separately approved |
| 01 | mission-01-09 | Global Search | A | HOME_DASHBOARD | workspace/tool command palette | workspace jump; no indexed file/app search | read-only | test:home + dev/packaged smoke | PARTIAL — real workspace navigation; global indexed search not implemented |
| 01 | mission-01-10 | KNOuX Insight | A | HOME_DASHBOARD | measured scan or explicit no-estimate | measured insight card with no invented total | read-only | test:home + dev/packaged smoke | MEASURED_READ_ONLY |
| 01 | mission-01-11 | Recent Activity | A | HOME_DASHBOARD | scan/automation journals | real recent activity, empty when no journal | read-only | test:home + dev/packaged smoke | MEASURED_READ_ONLY |
| 01 | mission-01-12 | Pending Safe Actions | B | HOME_DASHBOARD | measured scan candidates | review-only pending item + explicit approval boundary | user approval inside owning service | test:home + dev/packaged smoke | PARTIAL — review-only from Home; no executor |
| 02 | mission-02-01 | Quick Scan | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-02 | Deep Scan | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-03 | Duplicate Finder | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-04 | Large Files | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-05 | Junk Cleaner | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-06 | Privacy Trace Check | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-07 | Startup Impact | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-08 | App Health | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-09 | System Health Pulse | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 02 | mission-02-10 | Smart Recommendations | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-01 | Sources | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-02 | Visual Library | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-03 | Collections | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-04 | Organization Builder | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-05 | Destinations | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-06 | Plan Review | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-07 | Execution | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-08 | History & Undo | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 03 | mission-03-09 | Suggestions | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-01 | Google Sheets | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-02 | Gmail | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-03 | Google Tasks | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-04 | Google Forms | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-05 | Google Contacts | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-06 | Google Calendar | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-07 | Google Picker | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-08 | Google Slides | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-09 | Google Chat | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 04 | mission-04-10 | Google Classroom | D | PENDING_MISSION | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-inventory | Installed Applications Register | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-identity | App Identity & Authenticode Trust | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-search | Multi-Parameter Software Search | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-publisher | Publisher Intelligence & Reputation | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-recent | Recently Changed Applications | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-uninstall-queue | Bulk Uninstall Queue & Batch Manager | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-leftovers | Orphaned Leftover Trace Analysis | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-updates | Software Update Center | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-size | Software Storage Footprint Treemap | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-store-packages | Package Center & WinGet Browser | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-associations | File Extension & Protocol Matrix | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 05 | app-startup-impact | Software Boot Impact Analyzer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-downloads-inventory | Downloads Folder Inventory | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-organize-preview | Visual Rule Builder & Organization Studio | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-organize-apply | Organization Staging & Change Review | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-organize-undo | File Organization Undo Timeline | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-empty-folders | Sparse Empty Folder Explorer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-hash | Cryptographic Hash Inspector | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-search | Instant Everything-Style File Search | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-type-map | File Format Type Distribution | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-recents | Recent File Timeline Histogram | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-largest | Ranked Large File Explorer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-metadata | Deep File Metadata & Attributes Dossier | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 06 | file-provenance | Trust Evidence & Provenance Board | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-disks | Volume Bays & Partition Manager | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-large-files | Heavy-File Storage Ledger | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-duplicates | Byte-Exact Duplicate Hash Groups | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-treemap | Interactive Storage Space Treemap | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-top-folders | Folder Ranking Waterfall | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-filetypes | Storage Byte Distribution by Category | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-scan-overview | Drive Coverage & Scan Dashboard | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-fragmentation | Drive Optimization & TRIM Dossier | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-smart | Disk Reliability & S.M.A.R.T. Health | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-reclaim | Storage Reclaim Planner & Basket | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-history | Capacity Trend Timeline | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 07 | storage-removable | Removable USB & External Volume Dock | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-temp-preview | Temporary Files Candidate Safety Ledger | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-temp-quarantine | Quarantine Review & Safety Vault | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-temp-undo | Cleanup Recovery Console & Journal | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-quarantine-list | Quarantine Vault File Inspector | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-estimate | Space Savings Breakdown & Calculator | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-recycle | Recycle Bin Multi-Volume Inspector | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-unused | Dormancy & Unused Files Explorer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-update-cache | Windows Update & Servicing Cache Gateway | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-browser-cache | Web Browser Profile Cache Inspector | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-logs | Log Retention & Dump Explorer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-schedule | Automated Cleanup Schedule Composer | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 08 | cleanup-reports | Before/After Cleanup Report Studio | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-overview | Windows Boot Autorun Register | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-disable | Autorun State Change Preview | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-restore | Startup Restoration & Rollback | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-sources | Autorun Source Coverage Map | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-journal | Startup Change Audit Journal | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-filter | Keyboard-First Autorun Query Console | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-impact | Boot Sequence Impact Timeline | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-services | Service Boot Policy Matrix | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-tasks | Logon Scheduled Task Timeline | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-delay | Delayed Launch Planner | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-batch | Autorun Batch Staging Tray | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 09 | startup-undo-all | Batch Recovery & Mass Rollback Workspace | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-health-check | System Pulse Overview Console | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-events | Windows Event Log Severity Ledger | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-processes | Active Process Register & Resources | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-signatures | System Binary Certificate Inspector | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-uptime | System Boot & Session Clock Timeline | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-perf | Live Performance Pulse Charts | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-drivers | Device Driver Inventory & Signatures | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-logs | Event Log Channel Explorer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-resources | Top Resource Consuming Processes | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-autostart | App-to-Process Cross-Service Links | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-services-map | System Service Dependency Graph | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | system-timeline | Unified System Event Timeline | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-interfaces | Network Interfaces Console | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-dns-config | DNS Resolver Configuration Dossier | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-adapters | Network Hardware Atlas & NIC Rack | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-connectivity | Connectivity Diagnostic Step Sequence | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-throughput | Real-Time Traffic & Throughput Chart | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-traceroute | Hop Route & Latency Visualizer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-topology | LAN Topology & Node Relationship Map | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-ports | Active Socket & Port Explorer | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-wifi | Wireless Wi-Fi Status & Signal Instrument | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-hosts | Windows Hosts File Inspector | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-proxies | Proxy & WinHTTP Configuration Graph | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | network-repair-link | Network Recovery & Reset Gateway | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-inventory | Device Hardware Atlas & Components | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-battery | Battery Charge & Health Instrument | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-cpu | Processor Architecture & Core Die | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-gpu | Graphics Adapter Bay & VRAM | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-memory | DIMM RAM Slots & Memory Layout | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-cycles | Battery Wear & Cycle Count Ledger | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-thermal | Thermal Sensors & Temperature Board | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-disks | Physical Disk Drives & Bus Interface | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-usb | USB Controller & Device Topology Tree | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-display | Monitor Topology & Resolution Canvas | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-audio | Audio Endpoint Mixer & Devices | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 10 | hardware-health-report | Hardware Evidence & Diagnostic Report | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-component-check | DISM CheckHealth Diagnostic Console | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-component-scan | DISM ScanHealth 7-Stage Console | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-component-restore | DISM RestoreHealth System Repair Wizard | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-files-verify | SFC VerifyOnly File Integrity Shield | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-files-repair | SFC ScanNow Protected File Repair Wizard | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-dns-flush | DNS Resolver Cache Refresh Preview | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-winsock-reset | Winsock Catalog Disruption Risk Review | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-tcpip-reset | TCP/IP Stack Reset Configuration Diff | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-history | System Repair Audit Journal | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-troubleshooters | Windows Troubleshooter Gateway | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-restore-point | System Restore Point Inspector | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 11 | repair-update-reset | Windows Update Servicing Reset Wizard | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-inventory | Windows SCM Service Register | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-control | Service State Change Review & Guard | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-undo | Service Startup Policy Undo Journal | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-dependencies | Interactive Service Dependency Network | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-protected | Protected Windows Core Services Atlas | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-search | SCM Keyboard-First Query Console | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-startup-report | Startup Policy Distribution Analytics | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-state-history | Service Transition State History | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-dependents | Cascade Service Dependency Impact Tree | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-diagnose | SCM Fault Investigation & Diagnostics | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-config | Startup Policy Configuration Diff | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 12 | services-perf | Shared-Process svchost.exe Monitor | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-smart-scan | Smart Scan Automated Workflow Flow | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-schedule-manager | Weekly Automation Calendar & Task Manager | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-run-history | Automation Run History Timeline | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-templates | Workflow Template Gallery & Library | A | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-schedule-plan | Recurrence Composer & Cron Preview | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-cleanup-plan | Safe Automated Cleanup Pipeline | C | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-notify | Notification Channel Routing Board | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-quiet-hours | Quiet Hours 24-Hour Dial | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-battery-policy | Power-Aware Scheduler & Battery Gating | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-retention | Artifact Retention Policy Timeline | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-export | Workflow Export & Schema Transfer | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 13 | auto-backup-plan | Backup Flow & Verification Designer | B | SCOPED_MILESTONE_ONLY | AUDIT_REQUIRED | AUDIT_REQUIRED | AUDIT_REQUIRED | NOT_VERIFIED | AUDIT_REQUIRED |
| 14 | mission-14-01 | Engine & Turbo Hardware | B | SCOPED_SAFETY_INCREMENT | renderer profile | preference sliders/cards; no engine provider | none (no effect) | test:settings + dev/packaged smoke | PARTIAL — preferences only; no engine executor |
| 14 | mission-14-02 | AI Copilot & Provider Keys | D | SCOPED_SAFETY_INCREMENT | session-memory key | session-only OpenRouter probe; no native vault/proxy | explicit test click; key discarded on close | no live provider test | BLOCKED — session-only key; no native vault/proxy |
| 14 | mission-14-03 | Google Workspace Hub | D | SCOPED_SAFETY_INCREMENT | none | disconnected status; no OAuth client/token | explicit OAuth consent required | no live account test | BLOCKED_REQUIRES_USER_ACTION — no OAuth connection |
| 14 | mission-14-04 | Automated Protection & Guards | B | SCOPED_SAFETY_INCREMENT | none | disabled/off switches; explicit not-implemented notice | none | test:settings + dev/packaged smoke | UNSUPPORTED — no guard engine; controls intentionally off |
| 14 | mission-14-05 | Neon Glass Customization | A | SCOPED_SAFETY_INCREMENT | renderer profile | persisted accent/density + page-local preview | user-initiated local | test:settings + dev/packaged smoke | PARTIAL — local preference; global theming/light parity incomplete |
| 14 | mission-14-06 | Language & Locale | A | SCOPED_SAFETY_INCREMENT | NavigationContext | live locale/theme switch; persisted | user-initiated local | test:settings + dev/packaged smoke | PARTIAL — live EN/AR and persisted; full light/RTL route coverage pending |
| 14 | mission-14-07 | Profile Backup & System Restore | B | SCOPED_SAFETY_INCREMENT | renderer profile | credential-free export, import preview/diff, reset | user-initiated local file; no secrets | test:settings + dev/packaged smoke | PARTIAL — non-secret preferences backup works; Windows restore not here |
| 14 | mission-14-08 | AI Assistant Chat | D | SCOPED_SAFETY_INCREMENT | session-memory key | assistant chat UI only; no consent/allowlist/proxy | blocked pending explicit consent | none | BLOCKED — no secure provider proxy/consent/allowlist |

## Scope inventory

- 01: 12 service descriptions
- 02: 10 service descriptions
- 03: 9 service descriptions
- 04: 10 service descriptions
- 05: 12 service descriptions
- 06: 12 service descriptions
- 07: 12 service descriptions
- 08: 12 service descriptions
- 09: 12 service descriptions
- 10: 36 service descriptions
- 11: 12 service descriptions
- 12: 12 service descriptions
- 13: 12 service descriptions
- 14: 8 service descriptions

**TOTAL: 181 advertised service entries in 14 missions.** This does NOT mean that 181 native executors exist. Technical quality and safety are separately verified.
