# Byte-Exact Duplicate Hash Groups — SERVICE EXPERIENCE SPEC
**Exact ID:** storage-duplicates | **Mission:** 07 — Storage Atlas | **Provisional class:** B

## الفكرة المميزة / Why this service feels alive
خدمة Byte-Exact Duplicate Hash Groups تفتح تجربة مستقلة في Capacity Topographic Map، وليس مجرد Card رقمية. بدلاً من مشاهدة تقرير جامد، يحدد المستخدم نطاق الخدمة، يرى ما يُفحص أو يتغير وما مصدر المعلومة، ويتخذ إجراءً واضحًا في نفس مساحة العمل.

## المسرح والتفاعل الخاص بالخدمة
- **Primary live preview:** مجموعات مكررات بألوان حسب بصمات SHA-256، مع اختيار Keeper.
- **الشخصية البصرية للقسم:** خريطة Treemap تتوسع مع قياس أحجام المجلدات الفعلية، مع تمييز المساحة الفارغة والقابلة للاسترداد.
- **Microanimation مرتبطة بالواقع:** موجة تعبئة القطاعات فقط حسب عينات التحليل الفعلية.
- **Inspector سياقي:** بايتات مثبتة، بيانات قرص حقيقية، غير معروف لا يعرض 0.
- **عرض المصدر:** اسم provider، توقيت آخر عينة، النطاق، حالات denied/unavailable، Badge يميز LIVE NATIVE عن TEST FIXTURE أو DESIGN DEMO.
- **مسار بصري:** قبل → أثناء → بعد؛ أي تغير في البيانات يجب أن يأتي من حدث فعلي، وليس Timer شكلي.
- **الأوضاع:** Day/Night بنفس بنية JSX، Arabic/English RTL، Low/Reduced motion، 1366×768 دون Page Scroll، الجداول فقط بتمرير داخلي.

## أزرار العمل المطلوبة لهذه الخدمة
1. **Select Search Root:** CTA واضح مرتبط بمنطق Byte-Exact Duplicate Hash Groups، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
2. **Compute Verified Hashes:** CTA واضح مرتبط بمنطق Byte-Exact Duplicate Hash Groups، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
3. **Choose Keepers:** CTA واضح مرتبط بمنطق Byte-Exact Duplicate Hash Groups، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
4. **Approve Action:** CTA واضح مرتبط بمنطق Byte-Exact Duplicate Hash Groups، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
5. **Verify and Undo if Safe:** CTA واضح مرتبط بمنطق Byte-Exact Duplicate Hash Groups، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.

## رحلة المستخدم
1. **Select:** اختَر المصدر والعنصر أو القاعدة الخاصة بـ Byte-Exact Duplicate Hash Groups، واعرض Preview لما سيُقاس أو يتغير.
2. **Measure:** احصل على قياسات/عناصر حقيقية من Provider معروف؛ تحديث أحداث Incremental وإيقاف Cancel.
3. **Review:** اعرض item count وCoverage وDiff وRisk قبل أي أثر.
4. **Act:** Reviewed user-controlled action with immutable before/after plan, consent, progress, journal and undo if genuinely reversible.
5. **Follow:** timeline للحالات idle/scoping/measuring/preview/consent/running/verifying/success/partial/cancelled/failed.
6. **Finish:** سجل نتائج مؤرخ، Postcondition موضوعي، Undo فقط إذا أثبت السجل عكس العملية بأمان.
7. **Next:** اقترح خدمة مرتبطة تؤدي العملية التالية مع نقل النطاق المختار، دون تشغيل غير مصرّح به تلقائيًا.

## الربط بالواقع الحالي — من جرد المستودع، ليس اختراعًا
- **المزوّد المسجل:** AUDIT_REQUIRED
- **UI/Executor المسجل:** AUDIT_REQUIRED
- **موافقة/استعادة مسجلة:** AUDIT_REQUIRED
- **دليل سابق مسجل:** NOT_VERIFIED
- **حالة المنتج المسجلة:** AUDIT_REQUIRED
- **Workbench ledger:** MEASURED_READ_ONLY
- أعد فحص provider وIPC الحي في الكود عند التنفيذ؛ كلمات AUDIT_REQUIRED أو NONE ليست مصدر API تخميني.

## إثبات القبول المطلوب لهذا المعرف
- ممنوع حذف كل نسخ المكرر، ويجب إثبات تساوي Bytes.
- أزرار الخدمة متصلة بوظائفها الحقيقية أو BLOCKED وسبب محدد وزر بديل مفيد، وليس Placeholder.
- Fixture E2E: correct result + empty + denied + interrupted + retry + partial + stale plan + disabled permission + optional recovery.
- اختبر عجلة القسم وفتح Workbench side/expanded، حفظ selection والتمرير الداخلي، keyboard/Escape، aria-live وReduced Motion.
- للعمل المؤثر: خطّة ثابتة البصمة، الموافقة المباشرة وقت التنفيذ، تحقق native postcondition والإيصال/التراجع الحقيقي.
- اختم بحالة SPEC_DEFINED أولًا، ولا ترفع إلى IMPLEMENTED_VERIFIED دون commit/fixture proof/screenshots/Windows packaging evidence.

## حدود الأمان
هذه مواصفات تنفيذ لا تصريح لتغيير ملفات المالك أو Registry أو Services أو البرامج أو حساباته. اختبر آثار Windows على disposable fixtures وMock/VM، وأطلب الموافقة في وقت العملية. Class A لا يحتاج mutation لكنه يحتاج تفاعلًا حقيقيًا ولا يبقى Dashboard خاملة.

## سيناريو تنفيذ مُتخصص — إلزامي (Owner quality bar)
**Live scene:** متاهة مجموعات مكررات حقيقية تنشأ بعد تثبيت same-content hash، مع Keeper واحد إلزامي لكل مجموعة.

**Exact interaction flow:**
1. Select scan scope
2. Group by size
3. Verify SHA-256 on candidates
4. Mark protected keepers
5. Preview safe quarantine

**Evidence & negative tests:** Collision وsymlink والملف الجاري الكتابة عليه يمنع حذف أي مكرر.

**Non-negotiable:** هذه الشاشة لا تكتمل برسمة؛ يلزم مزود فعلي + state transitions صادقة + اختبارات fixtures + إيصال عملية أو قياس حقيقي.
