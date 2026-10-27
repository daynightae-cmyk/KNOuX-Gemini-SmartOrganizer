# Google Workspace — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Connected API Bridge**: بطاقات موارد الحساب المصرح به وخرائط طلبات API المستجيبة فعلا وصلاحيات OAuth المحددة
**التفاعل:** أنوار الربط لا تنشط قبل وصول API response حقيقي
**القرارات:** نوع الصلاحيات وحصص API وحالة الطلب والموارد
**سلسلة الأوامر الأصلية:** Connect; select resource; preview API operation; confirm; refresh; disconnect

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (10)
- [Google Sheets](../../services/04_GOOGLE_WORKSPACE/mission-04-01.md) — mission-04-01 | D | CONNECTABLE_AWAITING_CONSENT — offline-tested; live browser consent and real Sheets read await owner approval
- [Gmail](../../services/04_GOOGLE_WORKSPACE/mission-04-02.md) — mission-04-02 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Tasks](../../services/04_GOOGLE_WORKSPACE/mission-04-03.md) — mission-04-03 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Forms](../../services/04_GOOGLE_WORKSPACE/mission-04-04.md) — mission-04-04 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Contacts](../../services/04_GOOGLE_WORKSPACE/mission-04-05.md) — mission-04-05 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Calendar](../../services/04_GOOGLE_WORKSPACE/mission-04-06.md) — mission-04-06 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Picker](../../services/04_GOOGLE_WORKSPACE/mission-04-07.md) — mission-04-07 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Slides](../../services/04_GOOGLE_WORKSPACE/mission-04-08.md) — mission-04-08 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Chat](../../services/04_GOOGLE_WORKSPACE/mission-04-09.md) — mission-04-09 | D | BLOCKED — fixture preview only; live provider and scope not implemented
- [Google Classroom](../../services/04_GOOGLE_WORKSPACE/mission-04-10.md) — mission-04-10 | D | BLOCKED — fixture preview only; live provider and scope not implemented

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
