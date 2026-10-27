# Startup Control — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Bootline Timeline**: سجل Autorun وScheduled Tasks وSCM مرتب على خط الإقلاع مع خطة تغيير حالة دقيقة
**التفاعل:** نبض حالة عنصر الإقلاع بعد إعادة قراءة Windows فقط
**القرارات:** المصدر واسم المهمة وبصمة الإعداد القديم والمخاطر
**سلسلة الأوامر الأصلية:** Inspect autorun; stage disable/enable/delay; approve; verify; restore

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [Windows Boot Autorun Register](../../services/09_STARTUP/startup-overview.md) — startup-overview | A | AUDIT_REQUIRED
- [Autorun State Change Preview](../../services/09_STARTUP/startup-disable.md) — startup-disable | B | AUDIT_REQUIRED
- [Startup Restoration & Rollback](../../services/09_STARTUP/startup-restore.md) — startup-restore | B | AUDIT_REQUIRED
- [Autorun Source Coverage Map](../../services/09_STARTUP/startup-sources.md) — startup-sources | A | AUDIT_REQUIRED
- [Startup Change Audit Journal](../../services/09_STARTUP/startup-journal.md) — startup-journal | A | AUDIT_REQUIRED
- [Keyboard-First Autorun Query Console](../../services/09_STARTUP/startup-filter.md) — startup-filter | A | AUDIT_REQUIRED
- [Boot Sequence Impact Timeline](../../services/09_STARTUP/startup-impact.md) — startup-impact | A | AUDIT_REQUIRED
- [Service Boot Policy Matrix](../../services/09_STARTUP/startup-services.md) — startup-services | C | AUDIT_REQUIRED
- [Logon Scheduled Task Timeline](../../services/09_STARTUP/startup-tasks.md) — startup-tasks | C | AUDIT_REQUIRED
- [Delayed Launch Planner](../../services/09_STARTUP/startup-delay.md) — startup-delay | B | AUDIT_REQUIRED
- [Autorun Batch Staging Tray](../../services/09_STARTUP/startup-batch.md) — startup-batch | B | AUDIT_REQUIRED
- [Batch Recovery & Mass Rollback Workspace](../../services/09_STARTUP/startup-undo-all.md) — startup-undo-all | B | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
