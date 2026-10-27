# Organize Files — SERVICE EXPERIENCE SPEC
**Exact ID:** mission-01-02 | **Mission:** 01 — Home / Command Deck | **Provisional class:** B

## الفكرة المميزة / Why this service feels alive
خدمة Organize Files تفتح تجربة مستقلة في Mission Control Bridge، وليس مجرد Card رقمية. بدلاً من مشاهدة تقرير جامد، يحدد المستخدم نطاق الخدمة، يرى ما يُفحص أو يتغير وما مصدر المعلومة، ويتخذ إجراءً واضحًا في نفس مساحة العمل.

## المسرح والتفاعل الخاص بالخدمة
- **Primary live preview:** خريطة ملفات ومجلدات من المصدر إلى الوجهة مع معاينة التغيير.
- **الشخصية البصرية للقسم:** ساحة قيادة KPI حقيقية ولوحة قرارات وشريط نشاط مستمر يفتح خدمة التنفيذ المالكة.
- **Microanimation مرتبطة بالواقع:** نقاط حركة بين عناصر Command Deck حسب الأحداث الحقيقية.
- **Inspector سياقي:** المؤشرات، مصدر الرقم، آخر تحديث، حالة المهمة المنتظرة.
- **عرض المصدر:** اسم provider، توقيت آخر عينة، النطاق، حالات denied/unavailable، Badge يميز LIVE NATIVE عن TEST FIXTURE أو DESIGN DEMO.
- **مسار بصري:** قبل → أثناء → بعد؛ أي تغير في البيانات يجب أن يأتي من حدث فعلي، وليس Timer شكلي.
- **الأوضاع:** Day/Night بنفس بنية JSX، Arabic/English RTL، Low/Reduced motion، 1366×768 دون Page Scroll، الجداول فقط بتمرير داخلي.

## أزرار العمل الموصولة المطلوبة لهذه الخدمة
1. **Authorize Source:** CTA واضح مرتبط بمنطق Organize Files، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
2. **Inspect Matched Files:** CTA واضح مرتبط بمنطق Organize Files، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
3. **Preview Source to Target:** CTA واضح مرتبط بمنطق Organize Files، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
4. **Approve Action:** CTA واضح مرتبط بمنطق Organize Files، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
5. **Verify and Undo if Safe:** CTA واضح مرتبط بمنطق Organize Files، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.

## رحلة المستخدم
1. **Select:** اختَر المصدر والعنصر أو القاعدة الخاصة بـ Organize Files، واعرض Preview لما سيُقاس أو يتغير.
2. **Measure:** احصل على قياسات/عناصر حقيقية من Provider معروف؛ تحديث أحداث Incremental وإيقاف Cancel.
3. **Review:** اعرض item count وCoverage وDiff وRisk قبل أي أثر.
4. **Act:** Reviewed user-controlled action with immutable before/after plan, consent, progress, journal and undo if genuinely reversible.
5. **Follow:** timeline للحالات idle/scoping/measuring/preview/consent/running/verifying/success/partial/cancelled/failed.
6. **Finish:** سجل نتائج مؤرخ، Postcondition موضوعي، Undo فقط إذا أثبت السجل عكس العملية بأمان.
7. **Next:** اقترح خدمة مرتبطة تؤدي العملية التالية مع نقل النطاق المختار، دون تشغيل غير مصرّح به تلقائيًا.

## الربط بالواقع الحالي — من جرد المستودع، ليس اختراعًا
- **المزوّد المسجل:** none on Home
- **UI/Executor المسجل:** deep link to Studio with no file mutation
- **موافقة/استعادة مسجلة:** read-only
- **دليل سابق مسجل:** test:home + dev/packaged smoke
- **حالة المنتج المسجلة:** PARTIAL — measured Home card; organization execution belongs to Studio
- **Workbench ledger:** AUDIT_REQUIRED
- أعد فحص provider وIPC الحي في الكود عند التنفيذ؛ كلمات AUDIT_REQUIRED أو NONE ليست مصدر API تخميني.

## إثبات القبول المطلوب لهذا المعرف
- البيانات الحقيقية محفوظة، اختبارات ملف مقفل/تعارض/Undo على Temp Fixtures.
- أزرار الخدمة متصلة بوظائفها الحقيقية أو BLOCKED وسبب محدد وزر بديل مفيد، وليس Placeholder.
- Fixture E2E: correct result + empty + denied + interrupted + retry + partial + stale plan + disabled permission + optional recovery.
- اختبر عجلة القسم وفتح Workbench side/expanded، حفظ selection والتمرير الداخلي، keyboard/Escape، aria-live وReduced Motion.
- للعمل المؤثر: خطّة ثابتة البصمة، الموافقة المباشرة وقت التنفيذ، تحقق native postcondition والإيصال/التراجع الحقيقي.
- اختم بحالة SPEC_DEFINED أولًا، ولا ترفع إلى IMPLEMENTED_VERIFIED دون commit/fixture proof/screenshots/Windows packaging evidence.

## حدود الأمان
هذه مواصفات تنفيذ لا تصريح لتغيير ملفات المالك أو Registry أو Services أو البرامج أو حساباته. اختبر آثار Windows على disposable fixtures وMock/VM، وأطلب الموافقة في وقت العملية. Class A لا يحتاج mutation لكنه يحتاج تفاعلًا حقيقيًا ولا يبقى Dashboard خاملة.
