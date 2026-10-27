# Windows Services — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**SCM Dependency Galaxy**: شبكة علاقات الخدمة الأم والتابعة مع الحالة الفعلية ونافذة أثر إيقاف/تشغيل/تعديل
**التفاعل:** العقد تنبض مع re-read/SCM event وليس حركة منفصلة عن الواقع
**القرارات:** اسم خدمة SCM الدقيق والخدمات التابعة والمحمية
**سلسلة الأوامر الأصلية:** Choose service; trace dependent chain; stage control; approve; reread

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [Windows SCM Service Register](../../services/12_SERVICES/services-inventory.md) — services-inventory | A | AUDIT_REQUIRED
- [Service State Change Review & Guard](../../services/12_SERVICES/services-control.md) — services-control | C | AUDIT_REQUIRED
- [Service Startup Policy Undo Journal](../../services/12_SERVICES/services-undo.md) — services-undo | C | AUDIT_REQUIRED
- [Interactive Service Dependency Network](../../services/12_SERVICES/services-dependencies.md) — services-dependencies | A | AUDIT_REQUIRED
- [Protected Windows Core Services Atlas](../../services/12_SERVICES/services-protected.md) — services-protected | A | AUDIT_REQUIRED
- [SCM Keyboard-First Query Console](../../services/12_SERVICES/services-search.md) — services-search | A | AUDIT_REQUIRED
- [Startup Policy Distribution Analytics](../../services/12_SERVICES/services-startup-report.md) — services-startup-report | A | AUDIT_REQUIRED
- [Service Transition State History](../../services/12_SERVICES/services-state-history.md) — services-state-history | A | AUDIT_REQUIRED
- [Cascade Service Dependency Impact Tree](../../services/12_SERVICES/services-dependents.md) — services-dependents | A | AUDIT_REQUIRED
- [SCM Fault Investigation & Diagnostics](../../services/12_SERVICES/services-diagnose.md) — services-diagnose | A | AUDIT_REQUIRED
- [Startup Policy Configuration Diff](../../services/12_SERVICES/services-config.md) — services-config | C | AUDIT_REQUIRED
- [Shared-Process svchost.exe Monitor](../../services/12_SERVICES/services-perf.md) — services-perf | A | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
