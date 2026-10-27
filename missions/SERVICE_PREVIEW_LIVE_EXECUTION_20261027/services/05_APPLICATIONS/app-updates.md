# Software Update Center — SERVICE EXPERIENCE SPEC
**Exact ID:** app-updates | **Mission:** 05 — Applications | **Provisional class:** C

## الفكرة المميزة / Why this service feels alive
خدمة Software Update Center تفتح تجربة مستقلة في Software Dossier، وليس مجرد Card رقمية. بدلاً من مشاهدة تقرير جامد، يحدد المستخدم نطاق الخدمة، يرى ما يُفحص أو يتغير وما مصدر المعلومة، ويتخذ إجراءً واضحًا في نفس مساحة العمل.

## المسرح والتفاعل الخاص بالخدمة
- **Primary live preview:** لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Software Update Center مع اختيار النطاق والنتائج الفعلية.
- **الشخصية البصرية للقسم:** رف البرامج الحقيقية مع Publisher وSignature وVersion وحجم كل برنامج وخطة الإزالة/التحديث الدقيقة.
- **Microanimation مرتبطة بالواقع:** بطاقة البرنامج تتحول إلى Verified Installed/Removed فقط بعد re-read فعلي.
- **Inspector سياقي:** توقيع الناشر ومصدر التثبيت وإجراءات الموافقة.
- **عرض المصدر:** اسم provider، توقيت آخر عينة، النطاق، حالات denied/unavailable، Badge يميز LIVE NATIVE عن TEST FIXTURE أو DESIGN DEMO.
- **مسار بصري:** قبل → أثناء → بعد؛ أي تغير في البيانات يجب أن يأتي من حدث فعلي، وليس Timer شكلي.
- **الأوضاع:** Day/Night بنفس بنية JSX، Arabic/English RTL، Low/Reduced motion، 1366×768 دون Page Scroll، الجداول فقط بتمرير داخلي.

## أزرار العمل المطلوبة لهذه الخدمة
1. **Choose Scope:** CTA واضح مرتبط بمنطق Software Update Center، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
2. **Start Real Operation:** CTA واضح مرتبط بمنطق Software Update Center، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
3. **Inspect Result:** CTA واضح مرتبط بمنطق Software Update Center، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
4. **Confirm Privileged Run:** CTA واضح مرتبط بمنطق Software Update Center، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
5. **Verify Result / Recovery:** CTA واضح مرتبط بمنطق Software Update Center، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.

## رحلة المستخدم
1. **Select:** اختَر المصدر والعنصر أو القاعدة الخاصة بـ Software Update Center، واعرض Preview لما سيُقاس أو يتغير.
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
- **Workbench ledger:** PARTIAL
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
**Live scene:** مقارنة Upgrade Dossier: إصدار حالي مقابل إصدار معروض من WinGet مع المصدر والتوقيع والتبعيات، ثم Progress حقيقي.

**Exact interaction flow:**
1. Inspect installed package
2. Query updates
3. Review package source/signature
4. Approve supported update
5. Verify new version

**Evidence & negative tests:** في اختبار fixture اثبت خروج installer وpackage version؛ تعامل مع exit code 3010/reboot.

**Non-negotiable:** هذه الشاشة لا تكتمل برسمة؛ يلزم مزود فعلي + state transitions صادقة + اختبارات fixtures + إيصال عملية أو قياس حقيقي.
