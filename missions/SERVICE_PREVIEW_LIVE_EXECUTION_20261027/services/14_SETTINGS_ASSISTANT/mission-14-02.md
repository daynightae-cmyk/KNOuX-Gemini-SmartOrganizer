# AI Copilot & Provider Keys — SERVICE EXPERIENCE SPEC
**Exact ID:** mission-14-02 | **Mission:** 14 — Settings & Assistant | **Provisional class:** D

## الفكرة المميزة / Why this service feels alive
خدمة AI Copilot & Provider Keys تفتح تجربة مستقلة في Preference & AI Lab، وليس مجرد Card رقمية. بدلاً من مشاهدة تقرير جامد، يحدد المستخدم نطاق الخدمة، يرى ما يُفحص أو يتغير وما مصدر المعلومة، ويتخذ إجراءً واضحًا في نفس مساحة العمل.

## المسرح والتفاعل الخاص بالخدمة
- **Primary live preview:** لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة AI Copilot & Provider Keys مع اختيار النطاق والنتائج الفعلية.
- **الشخصية البصرية للقسم:** معاينة مقارنة للإعدادات واللغة والثيم مع حدود واجهات AI وسجل أدواته المصرح بها.
- **Microanimation مرتبطة بالواقع:** المعاينة تتغير فورًا لكن الحفظ لا يتم إلا بعد Apply.
- **Inspector سياقي:** الدلتا الفعلية والأسرار المحجوبة والتأثير على الواجهة.
- **عرض المصدر:** اسم provider، توقيت آخر عينة، النطاق، حالات denied/unavailable، Badge يميز LIVE NATIVE عن TEST FIXTURE أو DESIGN DEMO.
- **مسار بصري:** قبل → أثناء → بعد؛ أي تغير في البيانات يجب أن يأتي من حدث فعلي، وليس Timer شكلي.
- **الأوضاع:** Day/Night بنفس بنية JSX، Arabic/English RTL، Low/Reduced motion، 1366×768 دون Page Scroll، الجداول فقط بتمرير داخلي.

## أزرار العمل المطلوبة لهذه الخدمة
1. **Choose Scope:** CTA واضح مرتبط بمنطق AI Copilot & Provider Keys، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
2. **Start Real Operation:** CTA واضح مرتبط بمنطق AI Copilot & Provider Keys، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
3. **Inspect Result:** CTA واضح مرتبط بمنطق AI Copilot & Provider Keys، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
4. **Confirm Authorized API:** CTA واضح مرتبط بمنطق AI Copilot & Provider Keys، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
5. **Disconnect / Inspect Receipt:** CTA واضح مرتبط بمنطق AI Copilot & Provider Keys، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.

## رحلة المستخدم
1. **Select:** اختَر المصدر والعنصر أو القاعدة الخاصة بـ AI Copilot & Provider Keys، واعرض Preview لما سيُقاس أو يتغير.
2. **Measure:** احصل على قياسات/عناصر حقيقية من Provider معروف؛ تحديث أحداث Incremental وإيقاف Cancel.
3. **Review:** اعرض item count وCoverage وDiff وRisk قبل أي أثر.
4. **Act:** External connector: OAuth scopes, resource selection, API request consent and checked results; no live account use without authorization.
5. **Follow:** timeline للحالات idle/scoping/measuring/preview/consent/running/verifying/success/partial/cancelled/failed.
6. **Finish:** سجل نتائج مؤرخ، Postcondition موضوعي، Undo فقط إذا أثبت السجل عكس العملية بأمان.
7. **Next:** اقترح خدمة مرتبطة تؤدي العملية التالية مع نقل النطاق المختار، دون تشغيل غير مصرّح به تلقائيًا.

## الربط بالواقع الحالي — من جرد المستودع، ليس اختراعًا
- **المزوّد المسجل:** session-memory key
- **UI/Executor المسجل:** session-only OpenRouter probe; no native vault/proxy
- **موافقة/استعادة مسجلة:** explicit test click; key discarded on close
- **دليل سابق مسجل:** no live provider test
- **حالة المنتج المسجلة:** BLOCKED — session-only key; no native vault/proxy
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
**Live scene:** Secure Provider Control Desk: تبديل النموذج/الحدود والـusage قبل أي اتصال، ومخزن أسرار Windows Main فقط.

**Exact interaction flow:**
1. Open credential vault
2. Add key securely
3. Test authorized connection
4. Set network/spend limits
5. Revoke key

**Evidence & negative tests:** لا تخزين المفتاح في React/localStorage، ولا وصول API بلا موافقة.

**Non-negotiable:** هذه الشاشة لا تكتمل برسمة؛ يلزم مزود فعلي + state transitions صادقة + اختبارات fixtures + إيصال عملية أو قياس حقيقي.
