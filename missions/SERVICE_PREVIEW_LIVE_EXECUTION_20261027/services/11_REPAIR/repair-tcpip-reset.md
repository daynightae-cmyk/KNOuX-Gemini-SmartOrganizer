# TCP/IP Stack Reset Configuration Diff — SERVICE EXPERIENCE SPEC
**Exact ID:** repair-tcpip-reset | **Mission:** 11 — Repair Lab | **Provisional class:** C

## الفكرة المميزة / Why this service feels alive
خدمة TCP/IP Stack Reset Configuration Diff تفتح تجربة مستقلة في Guided Rescue Sequence، وليس مجرد Card رقمية. بدلاً من مشاهدة تقرير جامد، يحدد المستخدم نطاق الخدمة، يرى ما يُفحص أو يتغير وما مصدر المعلومة، ويتخذ إجراءً واضحًا في نفس مساحة العمل.

## المسرح والتفاعل الخاص بالخدمة
- **Primary live preview:** لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة TCP/IP Stack Reset Configuration Diff مع اختيار النطاق والنتائج الفعلية.
- **الشخصية البصرية للقسم:** تسلسل تشخيص وإصلاح متدرج بملخص الأمر المعتمد ومخرجات runner الحقيقية.
- **Microanimation مرتبطة بالواقع:** خطوات الإصلاح تضيء عند وصول stdout/stderr أو status من التنفيذ المعتمد.
- **Inspector سياقي:** الدليل قبل/بعد، هل يلزم Reboot، وما لا يمكن التراجع عنه.
- **عرض المصدر:** اسم provider، توقيت آخر عينة، النطاق، حالات denied/unavailable، Badge يميز LIVE NATIVE عن TEST FIXTURE أو DESIGN DEMO.
- **مسار بصري:** قبل → أثناء → بعد؛ أي تغير في البيانات يجب أن يأتي من حدث فعلي، وليس Timer شكلي.
- **الأوضاع:** Day/Night بنفس بنية JSX، Arabic/English RTL، Low/Reduced motion، 1366×768 دون Page Scroll، الجداول فقط بتمرير داخلي.

## أزرار العمل المطلوبة لهذه الخدمة
1. **Choose Scope:** CTA واضح مرتبط بمنطق TCP/IP Stack Reset Configuration Diff، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
2. **Start Real Operation:** CTA واضح مرتبط بمنطق TCP/IP Stack Reset Configuration Diff، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
3. **Inspect Result:** CTA واضح مرتبط بمنطق TCP/IP Stack Reset Configuration Diff، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
4. **Confirm Privileged Run:** CTA واضح مرتبط بمنطق TCP/IP Stack Reset Configuration Diff، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
5. **Verify Result / Recovery:** CTA واضح مرتبط بمنطق TCP/IP Stack Reset Configuration Diff، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.

## رحلة المستخدم
1. **Select:** اختَر المصدر والعنصر أو القاعدة الخاصة بـ TCP/IP Stack Reset Configuration Diff، واعرض Preview لما سيُقاس أو يتغير.
2. **Measure:** احصل على قياسات/عناصر حقيقية من Provider معروف؛ تحديث أحداث Incremental وإيقاف Cancel.
3. **Review:** اعرض item count وCoverage وDiff وRisk قبل أي أثر.
4. **Act:** Risky/privileged or nonreversible action: permission check, protected-target denial, UAC/reboot disclosure, explicit approval and truthful after-state.
5. **Follow:** timeline للحالات idle/scoping/measuring/preview/consent/running/verifying/success/partial/cancelled/failed.
6. **Finish:** سجل نتائج مؤرخ، Postcondition موضوعي، Undo فقط إذا أثبت السجل عكس العملية بأمان.
7. **Next:** اقترح خدمة مرتبطة تؤدي العملية التالية مع نقل النطاق المختار، دون تشغيل غير مصرّح به تلقائيًا.

## الربط بالواقع الحالي — من جرد المستودع، ليس اختراعًا
- **المزوّد المسجل:** AUDIT_REQUIRED
- **UI/Executor المسجل:** AUDIT_REQUIRED
- **موافقة/استعادة مسجلة:** AUDIT_REQUIRED
- **دليل سابق مسجل:** NOT_VERIFIED
- **حالة المنتج المسجلة:** AUDIT_REQUIRED
- **Workbench ledger:** AUDIT_REQUIRED
- أعد فحص provider وIPC الحي في الكود عند التنفيذ؛ كلمات AUDIT_REQUIRED أو NONE ليست مصدر API تخميني.

## إثبات القبول المطلوب لهذا المعرف
- النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition.
- أزرار الخدمة متصلة بوظائفها الحقيقية أو BLOCKED وسبب محدد وزر بديل مفيد، وليس Placeholder.
- Fixture E2E: correct result + empty + denied + interrupted + retry + partial + stale plan + disabled permission + optional recovery.
- اختبر عجلة القسم وفتح Workbench side/expanded، حفظ selection والتمرير الداخلي، keyboard/Escape، aria-live وReduced Motion.
- للعمل المؤثر: خطّة ثابتة البصمة، الموافقة المباشرة وقت التنفيذ، تحقق native postcondition والإيصال/التراجع الحقيقي.
- اختم بحالة SPEC_DEFINED أولًا، ولا ترفع إلى IMPLEMENTED_VERIFIED دون commit/fixture proof/screenshots/Windows packaging evidence.

## حدود الأمان
هذه مواصفات تنفيذ لا تصريح لتغيير ملفات المالك أو Registry أو Services أو البرامج أو حساباته. اختبر آثار Windows على disposable fixtures وMock/VM، وأطلب الموافقة في وقت العملية. Class A لا يحتاج mutation لكنه يحتاج تفاعلًا حقيقيًا ولا يبقى Dashboard خاملة.

## سيناريو تنفيذ مُتخصص — إلزامي (Owner quality bar)
**Live scene:** خريطة Diff لواجهات TCP/IP وDNS/routes قبل/بعد مع تنبيه واضح عن فقد اتصال VPN والسياسات.

**Exact interaction flow:**
1. Snapshot current IP stack
2. Select supported reset
3. Show exact config diff
4. Confirm VM-only reset
5. Verify effective network after reboot

**Evidence & negative tests:** لا تعرض Resolved قبل reconnect/postcheck، ولا تخزن بيانات الشبكة الحساسة دون تقليل.

**Non-negotiable:** هذه الشاشة لا تكتمل برسمة؛ يلزم مزود فعلي + state transitions صادقة + اختبارات fixtures + إيصال عملية أو قياس حقيقي.
