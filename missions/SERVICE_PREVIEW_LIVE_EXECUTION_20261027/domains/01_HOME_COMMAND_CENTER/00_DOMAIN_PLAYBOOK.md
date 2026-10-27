# Home / Command Deck — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Mission Control Bridge**: ساحة قيادة KPI حقيقية ولوحة قرارات وشريط نشاط مستمر يفتح خدمة التنفيذ المالكة
**التفاعل:** نقاط حركة بين عناصر Command Deck حسب الأحداث الحقيقية
**القرارات:** المؤشرات، مصدر الرقم، آخر تحديث، حالة المهمة المنتظرة
**سلسلة الأوامر الأصلية:** Choose section; measure KPIs; inspect event; open owning tool; review pending plan

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [Smart Scan](../../services/01_HOME_COMMAND_CENTER/mission-01-01.md) — mission-01-01 | B | PARTIAL — real scan KPI/insight; scan execution belongs to the service
- [Organize Files](../../services/01_HOME_COMMAND_CENTER/mission-01-02.md) — mission-01-02 | B | PARTIAL — measured Home card; organization execution belongs to Studio
- [Applications](../../services/01_HOME_COMMAND_CENTER/mission-01-03.md) — mission-01-03 | B | PARTIAL — measured count displayed; management belongs to Applications
- [Storage](../../services/01_HOME_COMMAND_CENTER/mission-01-04.md) — mission-01-04 | A | MEASURED_READ_ONLY
- [Cleanup](../../services/01_HOME_COMMAND_CENTER/mission-01-05.md) — mission-01-05 | B | PARTIAL — measured candidate review; cleanup executor is separate
- [Startup Control](../../services/01_HOME_COMMAND_CENTER/mission-01-06.md) — mission-01-06 | B | PARTIAL — navigation and measured context; startup changes are separate
- [System Live Pulse](../../services/01_HOME_COMMAND_CENTER/mission-01-07.md) — mission-01-07 | A | MEASURED_READ_ONLY
- [Repair Lab](../../services/01_HOME_COMMAND_CENTER/mission-01-08.md) — mission-01-08 | B | PARTIAL — navigation only; repairs are separately approved
- [Global Search](../../services/01_HOME_COMMAND_CENTER/mission-01-09.md) — mission-01-09 | A | PARTIAL — real workspace navigation; global indexed search not implemented
- [KNOuX Insight](../../services/01_HOME_COMMAND_CENTER/mission-01-10.md) — mission-01-10 | A | MEASURED_READ_ONLY
- [Recent Activity](../../services/01_HOME_COMMAND_CENTER/mission-01-11.md) — mission-01-11 | A | MEASURED_READ_ONLY
- [Pending Safe Actions](../../services/01_HOME_COMMAND_CENTER/mission-01-12.md) — mission-01-12 | B | PARTIAL — review-only from Home; no executor

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
