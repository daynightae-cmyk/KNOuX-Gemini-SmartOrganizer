# -*- coding: utf-8 -*-
from pathlib import Path
import re, json, hashlib, subprocess, datetime, collections

REPO=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-UI")
APP=REPO/"apps"/"gemini-ui"
SRC=APP/"src"
OUT=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-FullStack-Missions-20261025")
OUT.mkdir(parents=True,exist_ok=True)
TICK=chr(96)
def code(s): return TICK+s+TICK
def git(*args):
    p=subprocess.run(["git","-C",str(REPO),*args],capture_output=True,text=True,encoding="utf-8",errors="replace")
    return p.stdout.strip() if p.returncode==0 else "UNAVAILABLE: "+p.stderr.strip()[:220]
def read(rel):
    p=SRC/rel
    return p.read_text(encoding="utf-8-sig",errors="replace") if p.exists() else ""
def one(block,name):
    m=re.search(r"\b"+re.escape(name)+r":\s*'([^']*)'",block)
    return m.group(1) if m else ""
def array(block,name):
    m=re.search(r"\b"+re.escape(name)+r":\s*\[([^\]]*)\]",block,re.S)
    return re.findall(r"'([^']*)'",m.group(1)) if m else []
descriptors=[]
txt=read("lib/service-ui-renderers.ts")
pat=r"(?ms)^  '([^']+)':\s*\{(.*?)^  \},"
for m in re.finditer(pat,txt):
    block=m.group(2)
    if "serviceId:" not in block: continue
    descriptors.append({"id":m.group(1),"world":one(block,"world"),"name":one(block,"labelEn"),
       "family":one(block,"family"),"signature":one(block,"signatureVisual"),
       "controls":array(block,"configurationControls"),"previews":array(block,"previewPanels"),
       "risk":one(block,"riskClass"),"previewMode":one(block,"previewMode"),"native":one(block,"nativeExecutionEnabled")})
if len(descriptors)!=132 or len({x["id"] for x in descriptors})!=132:
    raise RuntimeError(f"Expected 132 unique descriptors; parsed {len(descriptors)}")
worldcounts=dict(collections.Counter(x["world"] for x in descriptors))
SPECS=[
dict(id="01",slug="HOME",name="Home Command Center",worlds=[],main=["pages/HomePage.tsx","components/home/HomeCommandCenter.tsx","components/home/HomeDashboardPanels.tsx","components/home/EarthHorizonScene.tsx","lib/home-ui.ts"],extra=["Smart Scan","Organize Files","Applications","Storage","Cleanup","Startup Control","System Live Pulse","Repair Lab","Global Search","KNOuX Insight","Recent Activity","Pending Safe Actions"],goal="حوّل Home إلى غرفة قيادة حقيقية تجمع الحالة المثبتة من الأقسام بدل أرقام دعائية، مع الحفاظ على الكوكب والسينما البصرية والبطاقات الثماني والرسوم.",data="DeviceHealthMetric, IndexedFileCount, CandidateRecoveryEstimate, AutomationRunSummary, InstalledApplicationCount, WindowsServiceHealth, RecentVerifiedActivity, PendingSafeAction, QuickAccessItem؛ المصدر والطابع الزمني والدقة لكل قيمة؛ لا تحسب Health Score بدون معادلة معلنة.",backend="Aggregator read-only من providers الموجودة Windows, Files, Studio, Applications, Services, Automation, Storage؛ استعلامات متوازية bounded مع cache invalidation، partial-failure، snapshot consistency، never block home on one provider.",ux="Earth horizon hero أصلي، ستة KPIs مع trend/last collected، 8 rich command tiles، Insight مشروط بالأدلة، panels recent/quick access/storage، and right-side action review؛ صفر active statuses ملفقة.",risk="كل Pending Safe Action يفتح Stage/Preview في القسم المختص؛ لا تنفيذ ضار من Home مباشرة.",proof="كل Tile وKPI يوجّه صح؛ التلخيصات تتطابق مع مصادرها؛ تمثيل unavailable بدون رقم مختلق."),
dict(id="02",slug="SMART_SCAN",name="Smart Scan Intelligence",worlds=[],main=["pages/SmartScanPage.tsx","smart-scan/SmartScanPage.tsx","smart-scan/ScanResults.tsx","smart-scan/ScanReviewInspector.tsx","smart-scan/ScanServiceWorkspace.tsx","smart-scan/smartScan.types.ts","smart-scan/smartScan.fixtures.ts"],dirs=["smart-scan/service-renderers"],extra=["Quick Scan","Deep Scan","Duplicate Finder","Large Files","Junk Cleaner","Privacy Trace Check","Startup Impact","App Health","System Health Pulse","Smart Recommendations"],goal="اجعل Smart Scan منسق الفحص العالمي للتطبيق، مع عشر واجهات متخصصة وتحليل فعلي قابل للقياس، وليس شاشة تتظاهر بالفحص.",data="ScanSession {id,mode,sources,startedAt,finishedAt,progress,status}, ScanFinding {stableId,kind,evidence,bytes,severity,provenance,risk}, StageTiming, Coverage, Recommendations, ReviewPlan, PermissionScope.",backend="Coordinator لقراءة مزودات files/storage/cleanup/startup/apps/system؛ progress عبر typed event stream و cancellation؛ bounded filesystem traversal و no-follow junctions افتراضيًا؛ throttled and resumable checkpoints فقط عند الضرورة.",ux="Hero scanner مع pulse، 6 KPI، 10 service cards، scan stages، breakdown donut، findings ledger مع فلاتر وinspectors مخصصة، review footer؛ loading/permission/error/partial states؛ rendering performance عند مئات الآلاف.",risk="Preview-only before any mutation; no fictional 100% scan; progress must map to actual work and explicitly signal indeterminate when total unknown.",proof="كل واحدة من الخدمات العشر لها إعداد ونتائج ومعاينة مميزة؛ إلغاء الفحص يوقف العمل فعليًا؛ أي نتيجة مدعومة بمصدر."),
dict(id="03",slug="ORGANIZATION_STUDIO",name="Smart Organization Studio",worlds=[],main=["studio/StudioPage.tsx","studio/context.tsx","studio/modals.tsx","studio/panels.tsx","studio/parts.tsx","studio/types.ts"],dirs=["studio/workspaces"],extra=["Sources","Visual Library","Collections","Organization Builder","Destinations","Plan Review","Execution","History & Undo","Suggestions"],goal="الخدمة الأساسية للمنتج: اختر فولدر، امنحه صلاحية، افهرسه محليًا، اعرض المكتبة المصنفة، صمم قواعد، راجع خطة دقيقة، طبق بإذن، وارجع بالـUndo الموثق.",data="AuthorizedRoot, InventoryEntry, FileIdentity, ClassificationRule, Category, Collection, PlannedOp, Conflict, OrganizationPlan, ExecutionJournal, ReversalRecord; حفظ scope وpath identity وmtime/size/hash حين يلزم.",backend="REUSE electron/studio/folder-inventory.cjs وstudio-organization.cjs وstudio-safety.cjs وregister-studio-ipc.cjs وthumbnails؛ وصل UI contracts الحالية بعد تحقق؛ stream incremental enumeration، transactional journal، protected root checks، skip symlink/junction escape.",ux="9-stage studio layout أفقي؛ category grid 18 فئة، gallery مع thumbnails حقيقية، source cards، rule builder visual، dest explorer، diff-before/after، conflict matrix، progress execution stages، History&Undo receipt.",risk="Root permission explicit, recursive dry run، never delete originals before verified copy/move، atomic move when possible، collision policy explicit، per-op rollback and idempotency.",proof="اختبارات fixture مختلطة وfolder حقيقي قابل للتجربة وundo؛ لا ملف فريد يضيع؛ لا نجاح بالاعتماد على preview فقط."),
dict(id="04",slug="GOOGLE_WORKSPACE",name="Google Workspace Command Hub",worlds=[],main=["components/workspace/GoogleWorkspaceHub.tsx"],extra=["Google Sheets","Gmail","Google Tasks","Google Forms","Google Contacts","Google Calendar","Google Picker","Google Slides","Google Chat","Google Classroom"],goal="مركز إنتاجية متصل بGoogle فعليًا: 10 تجارب رئيسية بواجهة KNOuX مشتركة، لا زر alert عام، مع عمليات موافق عليها وصلاحيات scopes دقيقة.",data="OAuthConnection {accountId,scopes,expiresAt,status}, PaginatedResource, SyncCursor, ProviderRateLimit, SheetRange, GmailThread, TaskItem, FormSummary, ContactCard, CalendarEvent, PickerSelection, SlideDeck, ChatSpace, ClassroomCourse.",backend="Google OAuth2 PKCE desktop/browser supported flow وتخزين credential عبر OS secure storage، consent per scope، REST API adapters مع pagination, exponential backoff, quota/revocation and delta where supported؛ server secrets never embedded in Vite browser bundle.",ux="service rail 10 tabs، connection overview، sheets grid + row edits، Gmail three-pane thread/compose، Tasks kanban+agenda، Calendar day/week، Forms response preview، Contacts directory+dedupe، Slides thumbnails، Chat threads، Classroom assignments، Picker secure native provider file chooser.",risk="لا تعلن Google OAuth Connected إلا من verified token+account query؛ لا تستعمل alert('Successfully executed') أو local fake success؛ least privilege، read-only default، destructive actions double review.",proof="connected/disconnected/expired/revoked scopes, 401/403/429, empty paging, no message mutation without approval."),
dict(id="05",slug="APPLICATIONS",name="Software Command Center",worlds=["applications"],main=["pages/ApplicationsPage.tsx","components/app/ApplicationCommandSurface.tsx","components/app/ApplicationDossier.tsx","lib/app-inventory.ts"],extra=["Install","Uninstall Review","Repair","Modify","Update","Open","Details","Batch Actions","Inventory Refresh","Publisher Filter"],goal="مدير برامج مثل فخامة IObit بصريًا لكن بدليل Windows inventory فعلي وعزل طرق الإزالة والتحديث المختلفة، دون إهمال برامج portable/system.",data="InstalledApp {identity,publisher,version,scope,installLocation,installSource,uninstallMethod,productCode,signatureStatus,lastSeen,sizeEvidence}, AppOperationPlan, DependencyImpact, InstallerReceipt, LeftoverCandidate, UndoAvailability.",backend="Use existing electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs only after auditing; Windows registry HKLM/HKCU 32/64 view, MSI APIs, packaged/MSIX inventory, winget as optional managed adapter; trust signer via Authenticode; never invoke arbitrary uninstall string unsanitized.",ux="5 KPIs، searchable table، dossier with verified publisher, app identity, version, footprint and history؛ colored actions، per-app stage wizard، batch operations timeline and leftovers previews.",risk="Uninstall high risk, protected apps guard, elevation separated, explicit confirmation, installer cancellation rules, rollback only when technically available, no guaranteed 'undo uninstall'.",proof="مقارنة جردين للمطابقة مع برامج مثبتة فعلًا، uninstall preview before action, blocked system package."),
dict(id="06",slug="FILES",name="Instant Find Files Explorer",worlds=["files"],main=["pages/FilesPage.tsx","lib/file-inventory.ts","components/files/FileIcon.tsx"],extra=["Search","Extensions","Size Filter","Date Filter","Locations","List/Grid","Inspector","Copy Path","Calculate Hash","Organize Plan"],goal="محرك بحث محلي فائق السرعة يستلهم Everything في أداء الفهرسة والنتائج، لا شكله، مع معاينات rich وعقود أمان كاملة.",data="IndexLocation, IndexedFile {fileId,parentId,path,type,size,mtime,attributes,origin}, SearchQuery, SearchResultPage, IndexChange, FilePreview, HashJob, SourcePermission.",backend="Persistent incremental local index / safe watcher, optional USN journal only if supported, cross-volume and network fallback; no blocking full disk traversal for each keystroke؛ path normalization and Windows Unicode long paths; thumbnails separate sandbox bounded.",ux="Instant Find large search، filter chips، two distribution bands، virtualized ledger، icon/thumbnail table، contextual inspector preview، metadata inspector، sticky selection bar.",risk="Open/Reveal only validated existing path; hash streamed read-only; only plan mutations through Studio; no exposing sensitive paths to cloud.",proof="100K+ synthetic index responsiveness measured; index freshness and provider errors; 1366 viewport inspector visible."),
dict(id="07",slug="STORAGE",name="Volume Atlas Storage Intelligence",worlds=["storage"],main=["pages/StoragePage.tsx","lib/storage-inventory.ts"],extra=["Volume Cards","Drive Capacity","Space Treemap","Largest Files","Duplicate Files","File Types","Disk Health","Space Reclaim"],goal="أطلس المساحات الحقيقي عبر volumes، treemap قابلة للتكبير، تحليل largest/duplicate/filetypes وأداة استعادة مساحة آمنة.",data="PhysicalDisk, MountedVolume, CapacitySnapshot, FolderSizeRecord, TreemapNode, LargestItem, HealthTelemetry, ReclaimProposal, ScanCoverage.",backend="Windows volumes via native APIs or audited windows-providers, volume serial+GUID identity, efficient directory-size scan with access-denied awareness, junction cycle guard; SMART data only when supported provider explicitly.",ux="C/D/E drive bay cards، capacity KPIs، animated proportional treemap drilldown breadcrumbs، largest-items pane، inspector، file-type tabs، bottom actions.",risk="No cleanup from treemap directly; stage and redirect Cleanup/Studio; identify SSD/HDD before recommending defrag; safe report generation.",proof="capacity sums consistent and no double counting; connected drives appear/disappear; treemap sums correspond to scan scope."),
dict(id="08",slug="CLEANUP",name="Clean Room Safety Workbench",worlds=["cleanup"],main=["pages/CleanupPage.tsx","lib/cleanup-inventory.ts"],extra=["Temporary File Preview","Quarantine Cleanup","Undo Cleanup","Quarantine Browser","Reclaim Estimate","Recycle Bin","Unused Items","Windows Update Cache","Browser Cache","Log Explorer","Cleanup Scheduler","Cleanup Reports"],goal="تنظيف آمن قابل للمراجعة والاسترداد، مع قائمة مرشحين مثبتة ومقاييس reclaimed bytes حقيقية.",data="CleanupCandidate {fileId,path,owner,source,reason,risk,size,openHandle}, SafetyDecision, QuarantineEntry, ReclaimEstimate, CleanupSession, CleanupJournal, RecoveryPlan.",backend="Audited Windows cache/file discovery with system-protected exclusions؛ quarantine staging in same volume when possible، atomic metadata journal، remeasure bytes after verified actions؛ browser caches must check process ownership.",ux="Clean Room hero، coverage gauge، category distribution، candidate ledger with safety badges، inspector checklist، 8-step review flow، services grid and bottom review.",risk="Never clean profile documents, Windows servicing stores, active browser sessions or shared app folders without explicit eligibility; downloads default not safe; support safe cancel+partial rollback.",proof="sandbox clean+undo leaves source unchanged on preview; permission denied and locked-files honest; measured recovered space."),
dict(id="09",slug="STARTUP",name="Boot Control & Startup Optimizer",worlds=["startup"],main=["pages/StartupPage.tsx","lib/startup-inventory.ts","components/common/LiveProcessInspector.tsx"],extra=["Boot Waterfall","Registry HKCU/HKLM","Scheduled Tasks","Startup Folders","Delayed Services","Batch Optimization","Impact Analysis","Restore History"],goal="مراقبة وتهيئة عناصر بدء Windows مع أدلة واقعية ودون تدمير مداخل النظام؛ إصلاح نافذة Telemetry التي تغطي الجدول.",data="StartupEntry {stableId,sourceKind,scope,path,args,signature,publisher,state}, BootDurationSample, BootImpactEstimate, ProposedStartChange, StartupChangeJournal.",backend="Audit electron/startup-manager.cjs and Windows registry entries, startup folders, Task Scheduler APIs and SCM delayed services, Windows boot diagnostics; per-source update adapter with ACL and eligibility checks.",ux="Boot waterfall timeline، KPIs، facets per source، dense register، selected item dossier، staged impact explanations، live inspector docked/non-obscuring، bottom command bar.",risk="Never disable AV/EDR/drivers/critical services; Windows Security protected; preserve original value, command and ACLs for verifiable reversion; delay only where semantics supported.",proof="source inventory matches OS; user-approved disable/re-enable test for safe sandbox entry; protected entries rejected."),
dict(id="10",slug="SYSTEM",name="Live Pulse + Network & Hardware Diagnostics",worlds=["system","network","hardware"],main=["pages/SystemPage.tsx","lib/system-inventory.ts"],extra=["CPU","Memory","Disk Activity","Network Activity","Process Ledger","Live Service Preview","System Diagnostics","Network Tools","Hardware Explorer"],goal="مرصد Windows حقيقي بإشارات telemetry ذات مصادر واضحة مع معالجة الفراغات الضخمة؛ يغطي system/network/hardware المسجلة في Registry دون افتراض أنها مربوطة حاليًا.",data="TimestampedSample {counterId,value,unit,source,quality}, ProcessSnapshot, HardwareIdentity, NetworkInterface, ConnectionEvent, DriverSignature, SystemEvent, SampleSeries, CapabilityState.",backend="Use audited Windows providers and performance counters/WMI/PDH/ETW where warranted؛ batched sampling with backpressure, explicit unsupported/counter denied; driver/display/hardware inventory read-only and no kernel drivers.",ux="4 gauges and sparklines، performance timeline، process ledger، system facts، diagnostics palette؛ network topology and interfaces inspector، hardware atlas and battery/thermal charts only when available.",risk="Process controls restricted and protected processes read-only; ping/traceroute explicit target validation and bounded timeouts; no third-party telemetry/upload without consent.",proof="measured CPU in valid unit/range، graph timestamps aligned، network counters correct adapter identity، absent sensors show unsupported."),
dict(id="11",slug="REPAIR",name="Recovery Lab Windows Repair",worlds=["repair"],main=["pages/RepairPage.tsx","lib/repair-inventory.ts"],extra=["DISM CheckHealth","DISM ScanHealth","DISM RestoreHealth","SFC VerifyOnly","SFC ScanNow","Flush DNS","Reset Winsock","Reset TCP/IP","Repair History","Windows Troubleshooters","Restore Point Review","Windows Update Repair"],goal="مختبر إصلاح بأوامر مضبوطة ومدخلات محدودة، يوضح scope والامتيازات والآثار والنتائج، مع History وpre/post checks.",data="DiagnosticEvidence, RepairCommandSpec, RepairPrerequisite, ElevationDecision, RepairRunProgress, RepairReceipt, RepairVerification, RebootRequirement.",backend="Audit electron/privileged-runner.cjs and verification.cjs; use allowlisted Windows executables with fixed arguments via spawn without shell, user-approved elevation only, output stream sanitization, bounded cancellation and timeout.",ux="Repair tools grid، guided seven-stage sequence، command preview، risk/permission blocks، genuine run log + confidence verdict، history and verify result.",risk="High-risk Winsock/TCP-IP reset requires backup of config metadata and reboot warning, no auto elevation; restore points not guaranteed; never fake DISM success.",proof="read-only CheckHealth verified, admin-required state honest; controlled failure and cancellation logs."),
dict(id="12",slug="SERVICES",name="Service Commander",worlds=["services"],main=["pages/ServicesPage.tsx","lib/services-inventory.ts"],extra=["Services Register","Start/Stop","Undo Change","Dependencies","Protected Services","Service Search","Startup Type","History","Diagnosis","Performance"],goal="تحكم خدمات Windows عبر SCM بعلاقات الاعتماد والإذن الصريح، مع إظهار الـOperation Preview والسجل دون قص.",data="ServiceRecord {name,displayName,status,startType,account,pid,dependencies,dependents,protected}, ServiceOperationPlan, DependencyImpact, ServiceEvent, ServiceReceipt.",backend="Existing windows providers / SCM enumeration and query, use constrained native service controller interface; operations require admin check, dependency impact, protected services deny-list by capabilities, not only fixed names.",ux="6 KPIs، service register searchable، dossier، interactive dependency graph، op preview، service cards، activity journal، persistent actions.",risk="Never stop WinDefend/critical Windows security/network base via app; no bulk destructive service edits; verify effective state after SCM response.",proof="start/stop safe test service only with user approval; verify dependency graph edges and blocked protected operations."),
dict(id="13",slug="AUTOMATION",name="Flow Studio Automation Engine",worlds=["automation"],main=["pages/AutomationPage.tsx","lib/automation-inventory.ts"],extra=["Smart Scan Scheduler","Schedule Manager","Run History","Workflow Templates","Schedule Planner","Cleanup Planner","Notification Rules","Quiet Hours","Battery Policies","Retention Policies","Automation Export","Backup Planner"],goal="Flow Studio فعلي بنود قابلة للتكوين، ومحرك جدولة محلي ذاتي الاسترداد مع approvals ومعاينة دقيقة، بدون أعمال تخريبية تلقائية.",data="WorkflowGraph, TypedNode, TriggerSpec, ConditionSpec, ActionSpec, ApprovalRequest, RunState, ScheduleSpec, ExecutionEdge, RetryPolicy, WorkflowJournal.",backend="Audit electron/automation.cjs, tool-registry.cjs; DAG validator, persisted workflow versions, local scheduler with DST handling, windows restart recovery, idempotent step tokens, bounded concurrency and cancellation.",ux="workflow library، canvas node editor zoom and ports، node inspector typed forms، service palette، step-through execution preview، timeline/journal، keyboard accessible graph.",risk="No automatic file delete, registry write or privileged action without per-run preapproval; retention policies preview; limit self-trigger loops, quotas and notification spam.",proof="workflow graph saves reloads, deterministic dryrun, crash resume idempotency, cycles rejected, user approval gating."),
dict(id="14",slug="SETTINGS_ASSISTANT",name="Settings, Security & AI Assistant",worlds=[],main=["pages/SettingsPage.tsx","components/chat/KNOuXAssistantChat.tsx","components/chat/ApiKeySetupModal.tsx"],extra=["Engine & Turbo Hardware","AI Copilot & Provider Keys","Google Workspace Hub","Automated Protection & Guards","Neon Glass Customization","Language & Locale","Profile Backup & System Restore","AI Assistant Chat"],goal="مركز تفضيلات فعلي يحترم الأسرار، يطبق RTL وtheme والحدود الصحيحة، ويمنع محاكاة اختبار API Key الكاذب.",data="TypedSettingsProfile, SecretRef, ProviderConnectionStatus, FeatureAvailability, LocalePreference, ThemeTokens, ConsentRecord, SettingsMigration, SecureExportManifest.",backend="Audit electron/settings.cjs and shared/settings-defaults.json and preload bridge; Windows DPAPI/Credential Manager or OS keystore for tokens; no secrets in localStorage, logs or export; feature toggles must map to actual capability.",ux="7 tabs، visual theme previews، density control، language switch live، provider connection tests، guarded settings, backup/export import preview and diff.",risk="Auto-clean/registry guard/auto-purge privacy off unless implemented and explicitly opted-in; no test status success unless actual authenticated request; backup restore scope and confirm.",proof="restart persistence, Arabic RTL, inaccessible-secret renderer, fake alert eradicated, exported profile no credentials.")
]

EXISTING_NATIVE_HINTS={
"applications":"electron/windows-providers.cjs, advanced-local-services.cjs, privileged-runner.cjs, tool-registry.cjs",
"files":"electron/main.cjs, windows-fs-metadata.cjs, studio/folder-inventory.cjs, studio/windows-studio-native.cjs",
"storage":"electron/windows-providers.cjs, advanced-local-services.cjs, windows-fs-metadata.cjs",
"cleanup":"electron/advanced-local-services.cjs, safe-move.cjs, privileged-runner.cjs, verification.cjs",
"startup":"electron/startup-manager.cjs, windows-providers.cjs, automation.cjs",
"system":"electron/windows-providers.cjs, verification.cjs, windows-fs-metadata.cjs",
"network":"electron/windows-providers.cjs and audited Windows networking APIs",
"hardware":"electron/windows-providers.cjs and supported OS telemetry",
"repair":"electron/privileged-runner.cjs, verification.cjs, main.cjs",
"services":"electron/windows-providers.cjs, privileged-runner.cjs, verification.cjs",
"automation":"electron/automation.cjs, tool-registry.cjs, settings.cjs",
}
VISUAL_ISSUES={
"HOME":"Home planetary hero and service imagery have lost cinematic depth; pending actions can fall below the viewport.",
"SMART_SCAN":"Ten service previews must be genuinely specialized, and simulated scan results must be labeled.",
"ORGANIZATION_STUDIO":"Studio creates its own titlebar/sidebar in source; investigate duplicate shell with the Gemini global shell before any redesign.",
"GOOGLE_WORKSPACE":"Current Google OAuth indicator initializes connected=true and handleAction shows a fake success alert. These are observed code issues, not verified integrations.",
"APPLICATIONS":"Compact table and dossier need readable text, selection dock and all actions visible without overlap.",
"FILES":"Floating assistant can cover Add to Organization Plan / bottom inspector controls. Actual file counts are fixture values.",
"STORAGE":"Preserve colorful treemap/drives/inspector and stop viewport footer clipping.",
"CLEANUP":"Preserve risk hierarchy and ensure footer is visible; no fake deletion success.",
"STARTUP":"The floating Live Process & Telemetry Inspector overlays the register and staged action region in provided screenshots.",
"SYSTEM":"Oversized empty performance/system panels push Process Ledger and toolcards below the viewport.",
"REPAIR":"Lower Actions and Repair History are partially obscured at current screenshot viewport.",
"SERVICES":"Operation Preview and service activity disappear below viewport; the dependency pane needs balanced height.",
"AUTOMATION":"Current flow canvas can waste horizontal space; retain nodes and links while improving zoom-to-fit.",
"SETTINGS_ASSISTANT":"Code uses localStorage for provider API keys and appears to set Test Connection success without real authentication; review before any key-related action."
}
SECTION_FILES={}
for spec in SPECS:
    files=list(spec["main"])
    for dn in spec.get("dirs",[]):
        directory=SRC/dn
        files += [str(p.relative_to(SRC)).replace("\\","/") for p in directory.rglob("*.tsx")] if directory.exists() else []
    spec["files"]=list(dict.fromkeys(files))
    SECTION_FILES[spec["slug"]]=spec["files"]

def source_contracts(files):
    records=[]
    for f in files:
        body=read(f)
        if not body: continue
        imports=re.findall(r"(?m)^import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]",body)
        states=re.findall(r"\buseState(?:<[^>]{1,140}>)?\s*\(",body)
        exported=re.findall(r"(?m)^export (?:const|function|interface|type)\s+([a-zA-Z0-9_]+)",body)
        fake=sorted(set(re.findall(r"\b(?:FIXTURE|mockData|INITIAL_[A-Z_]+|SAMPLE_[A-Z_]+)\b",body)))
        records.append({"path":f,"lines":len(body.splitlines()),"bytes":len(body.encode()),"imports":imports[:50],"exports":exported[:40],"useStateCalls":len(states),"mockSignals":fake[:28]})
    return records

def ui_controls(files):
    items=[]
    for f in files:
        body=read(f)
        for m in re.finditer(r"<(button|input|select|textarea)\b",body):
            tag=m.group(1)
            lineno=body.count("\n",0,m.start())+1
            window=body[m.start():m.start()+530]
            openpart=window[:min(340,window.find(">")+1)] if ">" in window else window[:240]
            event=re.search(r"\b(onClick|onChange|onSubmit|disabled|aria-label|title)\s*=",openpart)
            after=window[window.find(">")+1:window.find(">")+185] if ">" in window else ""
            labels=[x.strip() for x in re.findall(r"(?<=>)\s*([^<>{}\n]{2,65})\s*(?=<)",after) if x.strip()]
            hints=re.findall(r"(?:aria-label|title|placeholder)=['\"]([^'\"]+)['\"]",openpart)
            trigger=event.group(1) if event else "NO_DIRECT_EVENT_IN_OPENING_TAG"
            label=(hints[:1] or labels[:1] or ["[inspect source]"])[0]
            label=" ".join(label.split())[:85]
            items.append({"path":f,"line":lineno,"tag":tag,"event":trigger,"label":label})
        for m in re.finditer(r"\b(onClick|onChange|onSubmit)\s*=\s*\{",body):
            line=body.count("\n",0,m.start())+1
            look=body[max(0,m.start()-280):m.start()]
            opener=look.rfind("<")
            snippet=look[opener:][:85] if opener>=0 else ""
            if re.match(r"<(?:button|input|select|textarea)\b",snippet): continue
            items.append({"path":f,"line":line,"tag":"OTHER_INTERACTIVE","event":m.group(1),"label":snippet.replace("\n"," ")[:85]})
    return sorted(items,key=lambda x:(x["path"],x["line"]))

ALL_AUDITS={}
for s in SPECS:
    ALL_AUDITS[s["slug"]]={"sources":source_contracts(s["files"]),"controls":ui_controls(s["files"]),
       "services":[x for x in descriptors if x["world"] in s["worlds"]]}
native_paths=["electron/preload.cjs","electron/main.cjs","electron/windows-providers.cjs","electron/studio/register-studio-ipc.cjs","electron/privileged-runner.cjs","electron/automation.cjs","electron/settings.cjs","shared/contracts.ts"]
backend_summary={}
for f in native_paths:
    p=REPO/f
    body=p.read_text(encoding="utf-8",errors="replace") if p.exists() else ""
    backend_summary[f]={"exists":p.exists(),"bytes":len(body.encode()),"ipcHandlers":re.findall(r"ipcMain\.handle\(\s*['\"]([^'\"]+)",body)[:250],"ipcCalls":re.findall(r"ipcRenderer\.invoke\(\s*['\"]([^'\"]+)",body)[:250],"contextBridge":bool(re.search(r"exposeInMainWorld",body))}
snapshot={"generatedUTC":datetime.datetime.now(datetime.timezone.utc).isoformat(),"repo":str(REPO),"headAtAudit":git("rev-parse","HEAD"),"branchAtAudit":git("branch","--show-current"),"dirtyAtAudit":git("status","--porcelain=v1","-uall").splitlines(),"serviceRegistryCount":len(descriptors),"serviceWorldCounts":worldcounts,"nativeEvidence":backend_summary,"sections":{k:{"sources":v["sources"],"controlCounts":dict(collections.Counter(i["tag"] for i in v["controls"])),"controls":v["controls"],"serviceIds":[x["id"] for x in v["services"]]} for k,v in ALL_AUDITS.items()}}
(OUT/"SOURCE_INVENTORY_AND_CONTROL_AUDIT.json").write_text(json.dumps(snapshot,ensure_ascii=False,indent=2),encoding="utf-8")

BASELINE="""# NON-NEGOTIABLE EXECUTION MISSION

You are a senior full-stack Windows desktop product engineer, native integration architect, security reviewer, and visual designer. IMPLEMENT the current section end-to-end in the EXISTING KNOuX Gemini application; no planning-only output.

THIS IS A FUTURE PER-SECTION IMPLEMENTATION MISSION. Your first action when this file is handed to you is to INSPECT THE CURRENT REAL BRANCH/HEAD, ACTIVE AGENTS AND CODE; the snapshot attached to these missions was gathered on 2026-10-25 and may be stale.

Worktree (actual): D:\\KNOUX-Workspace\\KNOuX-Gemini-UI
Gemini application UI: apps/gemini-ui/
Existing Windows/Electron code exists at repository root under electron/ and shared/. Do not assume it is connected to the Gemini renderer; verify which imports, build entrypoint, preload exposure and contracts are really wired.

Do NOT modify K:\\Knoux Projects\\KNOuX SmartOrganizer\\Base or Studio-Closure or main. Do NOT create a new clone/worktree per section. Do NOT overwrite other agents' dirty files. Do NOT reset, clean, rebase, force-push, delete, discard unique work, or create bulky backup copies.

Trust level: visual screenshot and code sample only verify appearance. All imported Gemini fixture numbers, fabricated test data, simulated callbacks, mock connected badges and design-preview results are NOT native evidence. Distinguish REAL, FIXTURE, NOT CONNECTED, NO PERMISSION, PARTIAL and FAILED in both UI and reports.

IMPLEMENTATION PLAN IS NOT THE DELIVERABLE. Deliver real source changes, tests, and verified runtime screenshots on a feature branch, not an isolated replacement app. Preserve the approved dark navy/cyan/violet branded visual identity, image assets, typography, existing component behavior and navigation.

# FOUNDATION REUSE AND NATIVE ARCHITECTURE

1. Inventory existing root Electron main/preload/services/IPC/shared contracts and existing Gemini imports. Write a matrix: Existing+Connected / Existing+Unconnected / Missing / Unsupported / Unsafe.
2. REUSE already verified Windows native operations and Studio backend before implementing any parallel engine. Connect with precise typed versioned IPC allowlists, request validation, result validation, origin checks, main-process authorization and Electron contextIsolation/sandbox. No direct Node/fs/child_process from React renderer. No arbitrary command strings or generic execute(channel,args) endpoint. Do not weaken security to make a UI button work.
3. For privileged tasks, provide per-tool fixed capability IDs/arguments and separate explicit elevation gate, user consent, scope review, bounded execution, interruption/cancel, event stream, receipt, verified postcondition, journal and rollback only where technically possible.
4. All data-producing providers return {status, source, timestamp, coverage, permissions, warnings, data} in an appropriate typed contract; distinguish cached/partial/synthetic vs measured. No green status until the provider verifies the operation.
5. Keep deterministic design fixtures isolated, switchable only in Development/Preview with conspicuous labels. Production build must never silently substitute fixtures for failed native readings.
6. Ensure long operations are cancellable, limit concurrency and memory, stream pages/events, handle offline/locked/network drives and app closure. Use supported Windows APIs where available; do not rely on PowerShell UI or pop-up consoles. If a constrained executable must be spawned, spawn shell:false, explicit binary+fixed argument list, hidden window, no untrusted input interpolation.
7. All write/mutation workflows: inspect scope -> gather real evidence -> design-specific preview -> compute risks/conflicts -> stage immutable plan -> obtain explicit approval -> execute bounded -> verify postconditions -> persist journal -> show real result and recoverability. Reject symlinks/junction escape, protected Windows locations/services, stale plans and missing elevation.
8. Authenticated cloud operations use least-privilege scopes, credential storage outside renderer, reliable expiry/refresh/revocation handling, quotas/retries and consent. No credentials/PII in logs, screenshots, reports or Git. No fake OAuth connected banners.
9. Preserve existing live preview at 127.0.0.1:3000; do not start duplicate Vite processes. For real native tests, run properly packaged/dev Electron environment separately and label its output; web preview cannot prove native IPC.

# VISUAL AND INTERACTION ACCEPTANCE

At 1366x768, 1672x941 and 1920x1080 (browser zoom 100%), make workspace fit the desktop shell: no document-level page scroll, no horizontally clipped page, no controls blocked by assistant/floating panels, no inaccessible footer. Use minmax grids, flex, min-height:0, virtualized long lists and focused inner scrollers. Do not hide a whole service below the fold or shrink fonts to microscopic scale. Interactive elements require meaningful keyboard/RTL/light/dark states, tooltips, selection and error states.

Every existing button/control/event in the source audit is an acceptance item: document initial handler, intended action, data origin, UI preview, permissions, real implementation, error handling and test. Also review controls instantiated dynamically or via spread props—static extraction is not a complete runtime audit. No no-op button or fake toast claiming success.

Visual excellence means contextual data visualization and specialized domain inspector for each service—not a generic modal reused 132 times. Use real iconography, coherent status palette, micro-motion that respects reduced-motion preferences, drill-down, meaningful skeletons, accessible legends and trustworthy progress.

# RELEASE GATES

At every section boundary: check HEAD/branch/status, targeted unit+integration tests, package lint/typecheck/build, Playwright or equivalent interaction screenshots at 3 viewports, real Windows provider tests using safe nonproduction fixtures, fresh-start/restart state persistence, and regression smoke against already merged sections. If native tests require unsafe privileges, DO NOT perform them silently: leave explicit BLOCKED gate with proof of read-only state.

Commit coherent verified work; push to the existing Gemini feature branch when allowed after verifying no concurrent agents are editing the same files. DO NOT merge to main. Report starting/ending SHA, local vs origin SHA, exact changed paths, test command outputs, screenshots, safety decisions, list of untouched unique work, and honestly mark every unsupported requirement.

A screenshot is not native functionality proof; green CI is not visual parity proof; a mock dataset is not measured device data. No fake closure.
"""
WORLD_SOURCES={
"applications":"Registry uninstall keys across HKCU/HKLM 32/64 views; MSI/MSIX/Apps&Features/Winget where available; signed app identity.",
"files":"NTFS/non-NTFS index, validated authorized paths, incremental watchers, thumbnails, file metadata, stream hash.",
"storage":"Windows volume GUID+mount paths, physical disk identity, tree accounting, supported SMART, folder size aggregation.",
"cleanup":"OS-defined cache locations with app ownership + active-file checks, safe quarantine and recoverable ledger.",
"startup":"Registry Run entries, Startup folders, scheduled tasks, SCM services; boot diagnostics if available.",
"system":"Windows performance counters/process inventory/events and provider capabilities; timestamped telemetry.",
"network":"Windows network interfaces/routes/IP/DNS/connectivity and constrained diagnostic probes.",
"hardware":"WMI/CIM/Windows supported hardware/driver/sensor sources, explicit unavailable readings.",
"repair":"Approved, fixed-argument DISM/SFC/Windows diagnostics, elevation and genuine command output.",
"services":"Service Control Manager/status/config/dependency graph/events with protected service policy.",
"automation":"Persisted local trigger scheduler, typed DAG nodes, bounded executor and journal."
}
RISK_POLICY={
"read-only":"Implement read-only data retrieval and meaningful preview. No approval wizard just for reading, but require scope/grant where access is sensitive.",
"staged-change":"Dry-run and immutable staged changes. Explicit user approval per target and precise change set; verification + reversibility evidence.",
"administrative":"Must require validated admin capability, explicit high-risk confirmation and protected-resource denies. No bypass, no silent elevation."
}
def extra_service_block(s):
    if s["slug"]=="GOOGLE_WORKSPACE":
        return """Per-product backend specifics: Sheets list/get batchUpdate with user-selected ranges and revision checks; Gmail list/get thread and composed draft with explicit send gate; Tasks list/tasks patch with dedupe; Forms retrieve and response view where supported; Contacts People API and safe duplicate review; Calendar events with timezone/DST/attendee confirmation; Picker OAuth-scope-limited selection; Slides list/slides preview and controlled modification; Chat spaces/messages only with domain authorization; Classroom courses/coursework with school permissions. Google Drive/Docs are not primary tabs in the inspected source—do not claim they exist; add only if product scope/approved UI requires. Verify current scopes/API terms before integration."""
    if s["slug"]=="ORGANIZATION_STUDIO":
        return """Nine-stage native journey must survive app restart. Stages 1 SourceGrant, 2 VisualLibrary, 3 CollectionComposer, 4 RuleBuilder, 5 DestinationInspector, 6 PlanReview, 7 ExecutionMonitor, 8 HistoryUndoInspector, 9 SuggestionsReview. Dedicated file-identity, copy verification, conflict naming and per-op journal tests required. The source StudioPage embeds WindowsTitleBar and GlobalSidebar: avoid a second nested shell when connecting to app navigation."""
    if s["slug"]=="SMART_SCAN":
        return """Ten service renderers must be distinct: Quick, Deep, Duplicate, Large Files, Junk, Privacy, Startup Impact, App Health, System Health Pulse, Smart Recommendations. Scan tasks coordinate existing specialists; no parallel duplicate scanner backends. Detailed progress must report actual work or explicitly indeterminate."""
    if s["slug"]=="HOME":
        return """Every Home tile and KPI is a cross-section deep link and real provider aggregator. Never show a green 'completed scan' on a fixture activity feed. Pending actions must be stageable, reviewable and routed to their owning service; Home itself must not execute dangerous operations."""
    if s["slug"]=="SETTINGS_ASSISTANT":
        return """The observed code stores provider keys in browser localStorage and has a simulated success test. Remove/rework only with secure migration and user consent; never print/reveal keys, never commit secrets. Settings engine toggles with no actual native support must be disabled with honest explanations. AI assistant must request user consent for retrieval and tools, apply operation allowlist, and never execute freeform model-supplied commands."""
    return ""

def fmt_controls(items):
    if not items: return "No static JSX form controls detected in listed files. Inspect custom components and runtime manually."
    lines=[]
    for i in items:
        lines.append(f"- {code(i['path']+':'+str(i['line']))} | {i['tag']} | {i['event']} | {i['label']}")
    return "\n".join(lines)
def fmt_service(item,spec,position):
    sector=item["world"]; keys=(", ".join(item["controls"]) or "Read source for controls")
    previews=(", ".join(item["previews"]) or "Context-sensitive status and details")
    src=f"src/lib/service-ui-renderers.ts"
    native=EXISTING_NATIVE_HINTS.get(sector,"No existing adapter proven; investigate")
    proof=RISK_POLICY.get(item["risk"],"Validate risk classification")
    return f"""### {position:02d}. {item['name']} — {code(item['id'])}

- **Source evidence:** {src}, canonical world {sector}, descriptor family {item['family']}; risk class {item['risk']}; preview mode {item['previewMode']}. Current native execution in metadata is disabled.
- **Signature visual (source-defined):** {item['signature']}. Recreate this exact kind of visualization and make selection, keyboard focus, drilldown, hover evidence, compare/summary and loading/empty/error feel intentional.
- **Controls in descriptor:** {keys}. Every control must update section state or validated backend query; no fake controls.
- **Required contextual output panels:** {previews}. Do not swap for a generic modal. Make each panel bound to the currently selected real entity and observable state.
- **Real provider strategy:** {WORLD_SOURCES[sector]} First examine and REUSE {native}; document gaps before implementing a narrowly scoped missing capability. Define typed request/response schema for this service using its actual service ID and a unique scoped operation ID. Include capability discovery, progress or pagination, caching/provenance, cancellation and errors.
- **Safety & transaction policy:** {proof}
- **Acceptance evidence:** Verify normal/empty/unsupported/denied/error paths, a realistic domain dataset, update/selection interactions, keyboard/RTL, and screenshot parity. Measure requested versus actual results; show operation receipt if applicable.

"""
def fmt_expanded_services(s):
    service=ALL_AUDITS[s["slug"]]["services"]
    if service:
        lines=["## CANONICAL SERVICE-BY-SERVICE IMPLEMENTATION (NO SERVICE MAY BE SKIPPED)",""]
        if s["slug"]=="SYSTEM":
            lines+=["Important: 36 descriptors here span system, network and hardware; inspect whether each is currently linked to a navigable screen. A registry descriptor alone is NOT a working tool.",""]
        for idx,item in enumerate(service,1): lines.append(fmt_service(item,s,idx))
        return "\n".join(lines)
    return """## SCREEN-SPECIFIC OPERATIONS, SUBWORKSPACES & BACKEND

Every item here is mandatory within the scope of this section. If the code already implements it, verify and extend instead of duplicating it.

"""+"\n".join(f"""### {ix:02d}. {name}
- Create a dedicated entry/configuration experience and domain-specific preview, not a placeholder card.
- Find its current UI handler and source fixture/provenance; connect it to a narrowly scoped real provider after auditing existing native capabilities.
- Add typed inputs, precise empty/loading/permission/unsupported states, explicit action outcomes, recovery policy and tests.
- Keep the effect on dependent panels and cross-section navigation visible.
""" for ix,name in enumerate(s["extra"],1))
def sources_md(s):
    info=ALL_AUDITS[s["slug"]]["sources"]
    return "\n".join(f"- {code('src/'+q['path'])} — {q['lines']} lines; {q['useStateCalls']} state hooks; imported fixture signals: {', '.join(q['mockSignals'][:5]) or 'none detected'}" for q in info)
def evidence_model(s):
    worlds=s["worlds"]
    if not worlds: return "No 132-service world assigned directly. This section has its own custom subfeatures; see the operations list."
    return " + ".join(f"{w} ({worldcounts.get(w,0)} descriptors)" for w in worlds)
def make_mission(s):
    a=ALL_AUDITS[s["slug"]]
    source_files=sources_md(s)
    controls=fmt_controls(a["controls"])
    detailed=fmt_expanded_services(s)
    expected=s.get("proof","")
    date=datetime.datetime.now(datetime.timezone.utc).isoformat()
    parts=[
f"# KNOuX {s['id']} — {s['name'].upper()} — FULL-STACK EXECUTION MISSION",
f"**Standalone task file. Mission prepared:** {date}. **Read-only source snapshot SHA:** {snapshot['headAtAudit']}. Recheck every assumption at execution time.",
f"**Source audit scope:** {len(a['sources'])} code files, {len(a['controls'])} static UI controls/handlers, {len(a['services'])} canonical registry services. Worlds: {evidence_model(s)}.",
BASELINE,
f"## MISSION OBJECTIVE\n\n{s['goal']}\n",
f"## SPECIFIC DATA CONTRACTS & PROVENANCE\n\n{s['data']}\n\nRequired actual data interface should expose typed pagination/streaming where warranted, durable identity, permissions, provenance, error codes, capability detection and safe caching. Do not invent numbers.",
f"## BACKEND REUSE, WINDOWS AND PROVIDER IMPLEMENTATION\n\n{s['backend']}\n\n**Existing native candidates to inspect first:** "+("; ".join(EXISTING_NATIVE_HINTS.get(w,"inspect root existing providers") for w in s["worlds"]) if s["worlds"] else "electron/main.cjs, electron/preload.cjs, shared/contracts.ts plus domain-specific existing modules."),
f"## CINEMATIC UI, WORKFLOWS & DOMAIN INTERACTION\n\n{s['ux']}\n\nAt all responsive desktop viewports preserve approved imagery, content hierarchy, dedicated domain inspector and visible bottom actions. Do not replace premium visual depth with simplistic wireframe widgets.",
f"## SAFETY, PERMISSIONS & REAL EXECUTION\n\n{s['risk']}\n\nSeparate read-only discovery, preview-only simulation, authorized operation and verified postcondition. Do not expose raw Windows commands in the renderer.",
f"## OBSERVED VISUAL/CODE GAP TO FIX\n\n{VISUAL_ISSUES.get(s['slug'],'Inspect actual screenshot and code.')}\n\nThe statement above comes from the provided screenshots or inspected source and is a target for verification, not an assertion that a patch has already passed.",
f"## CODE FILES TO INSPECT FIRST (REUSE, DO NOT WIPE)\n\n{source_files}\n\nAlso inspect src/App.tsx, src/context/NavigationContext.tsx and shared shell for integration; inspect existing tests and the actual root Electron/native contract code.",
f"## SCREEN-SPECIFIC ACCEPTANCE\n\n{expected}\n\nVerify each user interaction in a real rendered app, and for native operations in a correct Electron environment. Do not claim native completion from localhost Vite UI.",
extra_service_block(s),
detailed,
"## FULL UI ACTION / CONTROL AUDIT — EXACT SOURCE LOCATIONS",
"""This is a static source index, NOT certified total runtime coverage. For EACH item listed below, read the JSX at the line, trace its click/change handler, state updates, relevant descriptor/engine, and record whether it is Working / Mock-only / No-op / Broken / Blocked / Implemented Verified. Inspect custom child components, dynamically generated controls, menu items and keyboard shortcuts as well.

Use a per-control verification table in your final handoff. Do not mark a button PASS because it has onClick or because it opens a modal; it must drive the correct native/preview action and display a genuine result.""",
controls,
"""## EXECUTION CHECKLIST — SECTION SIGN-OFF

[ ] Correct branch/head, no concurrent editor collision, unchanged unique work inventory
[ ] Explicit inventory of current services/controls from source and rendered UI
[ ] Actual native sources/providers reused before new engines
[ ] Typed requests/results, runtime validation, versioned capability exposure
[ ] All declared services have unique specialized UI and working user flows
[ ] Every existing button, filter, action, context menu and form accounted for
[ ] Real measurable data; fixture preview separately labeled
[ ] All elevated/destructive actions previewed and explicitly authorized
[ ] Cancel/timeouts/retry/idempotency/journal/verification, honest rollback limits
[ ] Arabic RTL, dark/light, keyboard, 1366/1672/1920 screenshots compared to reference
[ ] Deterministic unit, contract, integration, and safe native smoke tests
[ ] Typecheck/lint/build and available Windows packaged/runtime checks green
[ ] No new regressions in Home, Studio, Files, Applications or other integrated screens
[ ] New SHA, remote SHA, exact paths, test outputs and screenshots shown
[ ] Unverified/blocked service states enumerated: no fake DONE or 100%

Do not skip work and do not waste the mission rewriting already functioning code. Deliver and PUSH only coherent verified work. Never merge into main without user approval.
"""
    ]
    return "\n\n".join(x for x in parts if x)
platform="""# KNOuX 00 — ONE-TIME SECURE WINDOWS PLATFORM GATE

THIS IS THE FIRST TASK TO SEND BEFORE SECTION FULL-STACK MISSIONS, unless you can prove the new Gemini renderer already uses the EXISTING root Electron runtime. Execute, do not just propose.

Source locations:
- Current Gemini renderer apps/gemini-ui/src/
- Root application main.cjs, preload.cjs, windows-providers.cjs, privileged-runner.cjs, automation.cjs, tool-registry.cjs, settings.cjs
- Root studio modules in electron/studio/ and shared/contracts.ts
- Root build scripts/package.json and Gemini nested package.json.

Objective: create a SAFE INTEGRATION PLAN + IMPLEMENT THE MINIMAL SHARED PLATFORM that allows the current Gemini visual app to run as a protected Electron desktop client, REUSING root native providers instead of discarding them. Avoid repackaging with the root renderer by accident. Determine whether the root Electron stack currently loads Gemini UI, what preload exposes, and whether contracts can be shared versioned safely.

1. Reality: inspect Git state and worktrees. The Gemini branch can have dirty source from other agents: do not overwrite. Verify actual launcher and real packaged runtime. Preserve source and approved visuals.
2. Define versioned typed domain-specific IPC capabilities, allowed event streams and error envelopes; strict parameter/return validation, origin authorization, contextIsolation, CSP, no nodeIntegration, sandbox as supported.
3. Native provider reuse matrix with exact existing module paths/exports; avoid duplicate service engines. Implement minimal testable adapter for read-only machine/service inventory and Studio folder selection only if safely available. Defer unsafe actions to each section owner.
4. Proper Windows main/preload/bundle build and dev integration for the Gemini app, with reproducible install/build/test and no fake connected/ready badges.
5. Define shared source-of-truth types: ProviderCapability, NativeRequest, NativeResponse, OperationProgress, PermissionGate, OperationPlan, OperationJournal, SourceProvenance, Recoverability.
6. Provider result statuses: available, unavailable, unsupported, permission_denied, partial, cancelled, failed, complete. Every output includes source and observation time when appropriate. Errors are explicit and redacted.
7. Add provenance/no-mock build gate and DEV_FIXTURE flag isolated from production. Do not commit secrets; never store API tokens in localStorage.
8. Establish native tests using safe read-only flows and throwaway sandbox directories, 1366/1672/1920 visual smoke, Electron runtime smoke, packaged-app startup and CI artifacts.
9. Keep one canonical navigation/shell and read-only routes to old backend via typed adapters. Never open user-visible PowerShell/console.
10. Protect all current Gemini UI pages. No large-scale redesign, new worktrees, unnecessary backups, main merge or old K: edits.

Deliver: native bridge audit, exact file changes, verified Desktop launch evidence, command output, SHA and proof the new UI can securely call one native provider, and a COMPLETE section-by-section integration contract map.

Do not claim all 132 services are now connected after a platform smoke. Subsequent section missions own their actual service engines, UI and acceptance.
"""
platform=BASELINE+"\n\n"+platform
manifest=[]
def safe_write(path,content):
    if path.exists():
        if path.read_text(encoding="utf-8") != content: raise RuntimeError("Existing mission differs "+str(path))
        manifest.append({"file":path.name,"bytes":path.stat().st_size,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()})
        return
    path.write_text(content,encoding="utf-8",newline="\n")
    manifest.append({"file":path.name,"bytes":path.stat().st_size,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()})
safe_write(OUT/"00_PLATFORM_ELECTRON_NATIVE_BRIDGE_FIRST.md",platform)
for s in SPECS:
    fn=f"{s['id']}_{s['slug']}_FULLSTACK_MISSION.md"
    safe_write(OUT/fn,make_mission(s))
source_count=sum(len(x["sources"]) for x in ALL_AUDITS.values())
control_count=sum(len(x["controls"]) for x in ALL_AUDITS.values())
order=["00_PLATFORM_ELECTRON_NATIVE_BRIDGE_FIRST.md",
 "03_ORGANIZATION_STUDIO_FULLSTACK_MISSION.md","06_FILES_FULLSTACK_MISSION.md","07_STORAGE_FULLSTACK_MISSION.md",
 "02_SMART_SCAN_FULLSTACK_MISSION.md","05_APPLICATIONS_FULLSTACK_MISSION.md","08_CLEANUP_FULLSTACK_MISSION.md",
 "09_STARTUP_FULLSTACK_MISSION.md","10_SYSTEM_FULLSTACK_MISSION.md","11_REPAIR_FULLSTACK_MISSION.md",
 "12_SERVICES_FULLSTACK_MISSION.md","13_AUTOMATION_FULLSTACK_MISSION.md","04_GOOGLE_WORKSPACE_FULLSTACK_MISSION.md",
 "14_SETTINGS_ASSISTANT_FULLSTACK_MISSION.md","01_HOME_FULLSTACK_MISSION.md"]
index=f"""# KNOuX GEMINI — 14 FULL-STACK SECTION MISSIONS + 1 PLATFORM MISSION

Created locally in {OUT}. This is NOT a backup and NOT a change to either live application's code.

## VERIFIED SOURCE BASELINE WHEN PREPARED

- Git branch: {snapshot['branchAtAudit']}
- Git SHA: {snapshot['headAtAudit']}
- Dirty worktree detected during source audit: {len(snapshot['dirtyAtAudit'])} paths (agent work protected, not edited).
- Canonical service registry descriptors: {len(descriptors)} across 11 worlds: {worldcounts}
- Inspected section source file references: {source_count}
- Static JSX controls/handlers indexed: {control_count} across the 14 section audits. This is a source-level extraction, not proof every dynamically rendered button was tested.
- Existing root Electron native modules: {', '.join(backend_summary)}
- Gemini UI remains a nested React/Vite app; the audit does NOT prove the existing root Electron preload is connected to its renderer.

## DO THIS FIRST

1. Connect the agent to the authorized local D: worktree and GitHub. Tell it to inspect current source and avoid files being edited by other agents.
2. Give it ONE file only per mission, beginning with 00_PLATFORM_ELECTRON_NATIVE_BRIDGE_FIRST.md when the platform gap is not yet solved.
3. Review exact commits, native security, visual evidence and acceptance logs for that mission.
4. Only after verified completion, send the NEXT numbered section prompt. One shared Gemini feature branch, no worktree per screen.
5. The older K: app, main branch, Qoder/Traycer unique work and current live preview must be preserved.

## RECOMMENDED EXECUTION ORDER

"""+"\n".join(f"{i+1}. {x}" for i,x in enumerate(order))+"""

## IMPORTANT TRUTHFUL LIMITATIONS

- Service descriptors declare 132 planned native service interfaces and currently disable native execution. A registered descriptor is not proof of a provider or working button.
- Root repository contains legacy Electron/Windows native modules. They are valuable reuse candidates, not automatically connected to apps/gemini-ui.
- The accompanying JSON inventory maps file names, controls and service IDs from source code. It does not replace rendered runtime UI tests.
- Google Workspace has a fixture connected state and a fake success alert in inspected code. AI provider API key storage/testing requires security correction.
- Windows privileged actions must be staged and approved. Never run destructive smoke tests on the user's data.
- No changes to live application source were made by preparing these missions.

## PER-SECTION FILES

"""+"\n".join(f"- {s['id']}_{s['slug']}_FULLSTACK_MISSION.md — {s['name']} — {len(ALL_AUDITS[s['slug']]['services'])} registered services, {len(ALL_AUDITS[s['slug']]['controls'])} statically detected controls/handlers" for s in SPECS)+"""

## EXTRA AUDIT FILE

SOURCE_INVENTORY_AND_CONTROL_AUDIT.json contains the exact extraction output, SHA context, candidate backend modules, and every indexed control with path and line.

## MISSION EXECUTION REQUEST TEMPLATE

Execute the attached mission file IN FULL, inside D:\\KNOUX-Workspace\\KNOuX-Gemini-UI only. Verify current HEAD before editing, inspect real services, reuse the legacy Electron native backend safely, preserve the approved visuals, implement native/data/UI flows with safe staged operations, run tests and visual acceptance, and push coherent verified commits. No planning-only answer. No fake closure. Do not touch other worktrees or main.
"""
safe_write(OUT/"README_MISSION_INDEX.md",index)
(OUT/"MISSION_SHA256_MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
assert len([x for x in OUT.glob("*_FULLSTACK_MISSION.md")])==14
assert len(descriptors)==132
print(json.dumps({"result":"WRITTEN","destination":str(OUT),"missionCount":14,"platformMission":1,"sourceFilesAudited":source_count,"controlInventory":control_count,"canonicalServices":132,"byWorld":worldcounts,"files":len(list(OUT.iterdir())),"totalTextBytes":sum(x["bytes"] for x in manifest)},ensure_ascii=False))
