# System Observatory — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Live Measurement Deck**: أجهزة قياس أصلية قابلة للحفر للعمليات والشبكة والعتاد، بوقت عينة وحد تغطية
**التفاعل:** Graph streaming حقيقي، وحساسات غير مدعومة تعرض Unavailable
**القرارات:** العينات، تكرار القياس، مصدر WMI/CIM أو API
**سلسلة الأوامر الأصلية:** Measure live; pause monitor; inspect sample; compare range; export/handoff

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (36)
- [System Pulse Overview Console](../../services/10_SYSTEM/system-health-check.md) — system-health-check | A | AUDIT_REQUIRED
- [Windows Event Log Severity Ledger](../../services/10_SYSTEM/system-events.md) — system-events | A | AUDIT_REQUIRED
- [Active Process Register & Resources](../../services/10_SYSTEM/system-processes.md) — system-processes | A | AUDIT_REQUIRED
- [System Binary Certificate Inspector](../../services/10_SYSTEM/system-signatures.md) — system-signatures | A | AUDIT_REQUIRED
- [System Boot & Session Clock Timeline](../../services/10_SYSTEM/system-uptime.md) — system-uptime | A | AUDIT_REQUIRED
- [Live Performance Pulse Charts](../../services/10_SYSTEM/system-perf.md) — system-perf | A | AUDIT_REQUIRED
- [Device Driver Inventory & Signatures](../../services/10_SYSTEM/system-drivers.md) — system-drivers | A | AUDIT_REQUIRED
- [Event Log Channel Explorer](../../services/10_SYSTEM/system-logs.md) — system-logs | A | AUDIT_REQUIRED
- [Top Resource Consuming Processes](../../services/10_SYSTEM/system-resources.md) — system-resources | A | AUDIT_REQUIRED
- [App-to-Process Cross-Service Links](../../services/10_SYSTEM/system-autostart.md) — system-autostart | A | AUDIT_REQUIRED
- [System Service Dependency Graph](../../services/10_SYSTEM/system-services-map.md) — system-services-map | A | AUDIT_REQUIRED
- [Unified System Event Timeline](../../services/10_SYSTEM/system-timeline.md) — system-timeline | A | AUDIT_REQUIRED
- [Network Interfaces Console](../../services/10_SYSTEM/network-interfaces.md) — network-interfaces | A | AUDIT_REQUIRED
- [DNS Resolver Configuration Dossier](../../services/10_SYSTEM/network-dns-config.md) — network-dns-config | A | AUDIT_REQUIRED
- [Network Hardware Atlas & NIC Rack](../../services/10_SYSTEM/network-adapters.md) — network-adapters | A | AUDIT_REQUIRED
- [Connectivity Diagnostic Step Sequence](../../services/10_SYSTEM/network-connectivity.md) — network-connectivity | A | AUDIT_REQUIRED
- [Real-Time Traffic & Throughput Chart](../../services/10_SYSTEM/network-throughput.md) — network-throughput | A | AUDIT_REQUIRED
- [Hop Route & Latency Visualizer](../../services/10_SYSTEM/network-traceroute.md) — network-traceroute | A | AUDIT_REQUIRED
- [LAN Topology & Node Relationship Map](../../services/10_SYSTEM/network-topology.md) — network-topology | A | AUDIT_REQUIRED
- [Active Socket & Port Explorer](../../services/10_SYSTEM/network-ports.md) — network-ports | A | AUDIT_REQUIRED
- [Wireless Wi-Fi Status & Signal Instrument](../../services/10_SYSTEM/network-wifi.md) — network-wifi | A | AUDIT_REQUIRED
- [Windows Hosts File Inspector](../../services/10_SYSTEM/network-hosts.md) — network-hosts | A | AUDIT_REQUIRED
- [Proxy & WinHTTP Configuration Graph](../../services/10_SYSTEM/network-proxies.md) — network-proxies | A | AUDIT_REQUIRED
- [Network Recovery & Reset Gateway](../../services/10_SYSTEM/network-repair-link.md) — network-repair-link | C | AUDIT_REQUIRED
- [Device Hardware Atlas & Components](../../services/10_SYSTEM/hardware-inventory.md) — hardware-inventory | A | AUDIT_REQUIRED
- [Battery Charge & Health Instrument](../../services/10_SYSTEM/hardware-battery.md) — hardware-battery | A | AUDIT_REQUIRED
- [Processor Architecture & Core Die](../../services/10_SYSTEM/hardware-cpu.md) — hardware-cpu | A | AUDIT_REQUIRED
- [Graphics Adapter Bay & VRAM](../../services/10_SYSTEM/hardware-gpu.md) — hardware-gpu | A | AUDIT_REQUIRED
- [DIMM RAM Slots & Memory Layout](../../services/10_SYSTEM/hardware-memory.md) — hardware-memory | A | AUDIT_REQUIRED
- [Battery Wear & Cycle Count Ledger](../../services/10_SYSTEM/hardware-cycles.md) — hardware-cycles | A | AUDIT_REQUIRED
- [Thermal Sensors & Temperature Board](../../services/10_SYSTEM/hardware-thermal.md) — hardware-thermal | A | AUDIT_REQUIRED
- [Physical Disk Drives & Bus Interface](../../services/10_SYSTEM/hardware-disks.md) — hardware-disks | A | AUDIT_REQUIRED
- [USB Controller & Device Topology Tree](../../services/10_SYSTEM/hardware-usb.md) — hardware-usb | A | AUDIT_REQUIRED
- [Monitor Topology & Resolution Canvas](../../services/10_SYSTEM/hardware-display.md) — hardware-display | A | AUDIT_REQUIRED
- [Audio Endpoint Mixer & Devices](../../services/10_SYSTEM/hardware-audio.md) — hardware-audio | A | AUDIT_REQUIRED
- [Hardware Evidence & Diagnostic Report](../../services/10_SYSTEM/hardware-health-report.md) — hardware-health-report | A | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
