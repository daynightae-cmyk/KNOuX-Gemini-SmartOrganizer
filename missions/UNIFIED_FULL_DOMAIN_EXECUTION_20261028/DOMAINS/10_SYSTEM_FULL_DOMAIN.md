# FULL DOMAIN DELIVERY 10: System Observatory

THIS IS ONE COMPLETE EXECUTABLE DOMAIN ASSIGNMENT; ALL 36 EXACT SERVICES IN SCOPE. NO SUBMISSION OF ONLY FIRST 2-3 SERVICES AS FINAL.

## A. Complete product and visual intent
مرصد حي يقيس CPU وRAM وNetwork والعمليات والحساسات بمصادر Windows وتوقيت معروف، ويكشف المشكلات دون اختلاق قيم.

## B. End-to-end user journey and working controls
Select resource → begin bounded telemetry stream → inspect graph spike/process → compare intervals → export sample evidence → safe tool handoff.

## C. Native / IPC, permissions, effects, and data provenance
Windows actual telemetry with throttling, pause/reduced motion and nullable unsupported sensor values.

## D. Domain-specific destructive/racy edge cases
sensor missing, process exited, denied CIM/WMI, noisy samples, UI hidden, stale interval, memory leak.

## E. Common quality bar applying to EVERY service
Build unique live scene with actual backend measurements, meaningful action dock and service-specific inspector. Read source and consent. For effects, plan, request permission, execute in fixture/VM, verify outcome and Undo safety. Support empty, loading, blocked, partial, failed, cancelled, success; preserve progress through restart. No fake readings or fake operation success.
Integrate panel, route, orbital control and full detail workbench; controls keyboard-accessible. Keep DAY/NIGHT, EN/AR RTL, reduced-motion, fixed viewport and inner scrolling. Test Main+Preload+Renderer and Native fixtures, permissions, cancel, rollback, crash, timeouts, and visual geometry. Protect all previously accepted domains.

## F. ALL service IDs and required deliverables

### 1. System Pulse Overview Console [system-health-check]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: قياسات رقمية حيّة على رسم زمني بانتقال سلس وثابت المصدر
ALL REQUIRED INTERACTION BUTTONS: Begin Sampling | Change Interval | Inspect Spike | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: لا قيم حرارة/صحة مختلقة؛ العينات مؤرخة ومصدرها ظاهر
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-health-check.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-health-check in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 2. Windows Event Log Severity Ledger [system-events]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-events.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-events in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 3. Active Process Register & Resources [system-processes]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: قياسات رقمية حيّة على رسم زمني بانتقال سلس وثابت المصدر
ALL REQUIRED INTERACTION BUTTONS: Begin Sampling | Change Interval | Inspect Spike | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: لا قيم حرارة/صحة مختلقة؛ العينات مؤرخة ومصدرها ظاهر
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-processes.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-processes in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 4. System Binary Certificate Inspector [system-signatures]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: رادار تشخيص تدريجي تظهر فيه الأدلة وسبب التوصية
ALL REQUIRED INTERACTION BUTTONS: Start Diagnostic | Inspect Proof | Compare Baseline | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: الأدلة المقروءة تقود إلى إجراء حقيقي لا تصنع مؤشر صحة مزيفًا
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-signatures.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-signatures in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 5. System Boot & Session Clock Timeline [system-uptime]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-uptime.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-uptime in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 6. Live Performance Pulse Charts [system-perf]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: قياسات رقمية حيّة على رسم زمني بانتقال سلس وثابت المصدر
ALL REQUIRED INTERACTION BUTTONS: Begin Sampling | Change Interval | Inspect Spike | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: لا قيم حرارة/صحة مختلقة؛ العينات مؤرخة ومصدرها ظاهر
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-perf.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-perf in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 7. Device Driver Inventory & Signatures [system-drivers]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: بطاقة برنامج موسعة لمصدر التثبيت والإصدار والناشر والقرارات
ALL REQUIRED INTERACTION BUTTONS: Inspect Inventory | Verify Signer | Stage Official Operation | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: توافق Windows وWinGet/Uninstaller الرسمي ونتيجة إجراء فعلية
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-drivers.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-drivers in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 8. Event Log Channel Explorer [system-logs]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-logs.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-logs in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 9. Top Resource Consuming Processes [system-resources]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خريطة ملفات ومجلدات من المصدر إلى الوجهة مع معاينة التغيير
ALL REQUIRED INTERACTION BUTTONS: Authorize Source | Inspect Matched Files | Preview Source to Target | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: البيانات الحقيقية محفوظة، اختبارات ملف مقفل/تعارض/Undo على Temp Fixtures
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-resources.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-resources in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 10. App-to-Process Cross-Service Links [system-autostart]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة تبعية خدمات Windows وموجة تأثير على المكونات التابعة
ALL REQUIRED INTERACTION BUTTONS: Select Service | Inspect Dependencies | Stage Authorized Change | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: Fake SCM/VM ولا توقف خدمة محمية حقيقية
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-autostart.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-autostart in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 11. System Service Dependency Graph [system-services-map]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة تبعية خدمات Windows وموجة تأثير على المكونات التابعة
ALL REQUIRED INTERACTION BUTTONS: Select Service | Inspect Dependencies | Stage Authorized Change | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: Fake SCM/VM ولا توقف خدمة محمية حقيقية
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-services-map.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-services-map in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 12. Unified System Event Timeline [system-timeline]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/system-timeline.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row system-timeline in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 13. Network Interfaces Console [network-interfaces]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-interfaces.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-interfaces in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 14. DNS Resolver Configuration Dossier [network-dns-config]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-dns-config.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-dns-config in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 15. Network Hardware Atlas & NIC Rack [network-adapters]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-adapters.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-adapters in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 16. Connectivity Diagnostic Step Sequence [network-connectivity]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-connectivity.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-connectivity in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 17. Real-Time Traffic & Throughput Chart [network-throughput]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: قياسات رقمية حيّة على رسم زمني بانتقال سلس وثابت المصدر
ALL REQUIRED INTERACTION BUTTONS: Begin Sampling | Change Interval | Inspect Spike | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: لا قيم حرارة/صحة مختلقة؛ العينات مؤرخة ومصدرها ظاهر
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-throughput.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-throughput in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 18. Hop Route & Latency Visualizer [network-traceroute]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-traceroute.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-traceroute in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 19. LAN Topology & Node Relationship Map [network-topology]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-topology.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-topology in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 20. Active Socket & Port Explorer [network-ports]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-ports.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-ports in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 21. Wireless Wi-Fi Status & Signal Instrument [network-wifi]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Wireless Wi-Fi Status & Signal Instrument مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-wifi.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-wifi in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 22. Windows Hosts File Inspector [network-hosts]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-hosts.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-hosts in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 23. Proxy & WinHTTP Configuration Graph [network-proxies]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-proxies.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-proxies in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 24. Network Recovery & Reset Gateway [network-repair-link]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: سجل تراجع ذكي يعرض Source وDestination لكل تغيير وأي تعارضات جديدة
ALL REQUIRED INTERACTION BUTTONS: Review Receipt | Check Undo Safety | Preview Inverse Diff | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: يلزم إثبات رجوع البصمة والحالة السابقة دون الكتابة فوق تعديل أحدث
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/network-repair-link.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row network-repair-link in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 25. Device Hardware Atlas & Components [hardware-inventory]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: فهرس قابل للبحث والفرز والمقارنة مع بطاقة تفصيل ديناميكية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Run Targeted Query | Inspect Row | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: تتبع النتائج المؤرخة ونتيجة ضغط الزر والمرشح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-inventory.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-inventory in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 26. Battery Charge & Health Instrument [hardware-battery]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: ساعة 24h وجداول trigger تعرض التوقيت التالي وفق منطقة المستخدم
ALL REQUIRED INTERACTION BUTTONS: Set Rules | Preview Upcoming Runs | Validate Guardrails | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: اختبار VirtualClock وDST والسكون واستئناف المواعيد
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-battery.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-battery in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 27. Processor Architecture & Core Die [hardware-cpu]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Processor Architecture & Core Die مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-cpu.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-cpu in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 28. Graphics Adapter Bay & VRAM [hardware-gpu]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة
ALL REQUIRED INTERACTION BUTTONS: Select Interface | Run OS Diagnostic | Inspect Hop or Setting | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-gpu.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-gpu in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 29. DIMM RAM Slots & Memory Layout [hardware-memory]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة DIMM RAM Slots & Memory Layout مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-memory.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-memory in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 30. Battery Wear & Cycle Count Ledger [hardware-cycles]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: ساعة 24h وجداول trigger تعرض التوقيت التالي وفق منطقة المستخدم
ALL REQUIRED INTERACTION BUTTONS: Set Rules | Preview Upcoming Runs | Validate Guardrails | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: اختبار VirtualClock وDST والسكون واستئناف المواعيد
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-cycles.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-cycles in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 31. Thermal Sensors & Temperature Board [hardware-thermal]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: قياسات رقمية حيّة على رسم زمني بانتقال سلس وثابت المصدر
ALL REQUIRED INTERACTION BUTTONS: Begin Sampling | Change Interval | Inspect Spike | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: لا قيم حرارة/صحة مختلقة؛ العينات مؤرخة ومصدرها ظاهر
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-thermal.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-thermal in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 32. Physical Disk Drives & Bus Interface [hardware-disks]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Physical Disk Drives & Bus Interface مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-disks.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-disks in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 33. USB Controller & Device Topology Tree [hardware-usb]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-usb.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-usb in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 34. Monitor Topology & Resolution Canvas [hardware-display]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-display.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-display in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 35. Audio Endpoint Mixer & Devices [hardware-audio]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Audio Endpoint Mixer & Devices مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-audio.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-audio in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 36. Hardware Evidence & Diagnostic Report [hardware-health-report]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/10_SYSTEM/hardware-health-report.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row hardware-health-report in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

## G. MANDATORY full-domain closeout, not a partial wave
1. Reconcile all 36 service IDs in route/registry/native capabilities; there is no skipped ID.
2. Implement ALL native/visual/actions of this domain, including unique preview and controls per service; solve in internal logical commits while status remains IN_PROGRESS.
3. Run native fixture/negative tests, security allowlist and application Main+Preload+Renderer E2E, DAY/NIGHT EN/AR RTL responsive captures, reduced-motion, performance.
4. Inspect previous integrated domains for regression; no visual fixes are allowed to break their actions/consent/source identities.
5. Commit named source code, tests, screenshots, receipts and updated exact service acceptance rows on local integration branch; avoid committing generated sensitive data/keys or uncontrolled evidence.
6. If development occurred elsewhere, reconcile merge conflicts manually and merge before moving to next domain. Verify final ancestry+HEAD and run tests post-merge.
7. Report actual count implemented / externally blocked, action receipts, error paths, non-testable manual gates, final unified SHA. No DONE with missing items.

Domain status until all gates: DOMAIN_NOT_YET_COMPLETED.
