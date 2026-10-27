# Google Sheets — SERVICE EXPERIENCE SPEC
**Exact ID:** mission-04-01 | **Mission:** 04 — Google Workspace | **Provisional class:** D

## الفكرة المميزة / Why this service feels alive
خدمة Google Sheets تفتح تجربة مستقلة في Connected API Bridge، وليس مجرد Card رقمية. بدلاً من مشاهدة تقرير جامد، يحدد المستخدم نطاق الخدمة، يرى ما يُفحص أو يتغير وما مصدر المعلومة، ويتخذ إجراءً واضحًا في نفس مساحة العمل.

## المسرح والتفاعل الخاص بالخدمة
- **Primary live preview:** مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة.
- **الشخصية البصرية للقسم:** بطاقات موارد الحساب المصرح به وخرائط طلبات API المستجيبة فعلا وصلاحيات OAuth المحددة.
- **Microanimation مرتبطة بالواقع:** أنوار الربط لا تنشط قبل وصول API response حقيقي.
- **Inspector سياقي:** نوع الصلاحيات وحصص API وحالة الطلب والموارد.
- **عرض المصدر:** اسم provider، توقيت آخر عينة، النطاق، حالات denied/unavailable، Badge يميز LIVE NATIVE عن TEST FIXTURE أو DESIGN DEMO.
- **مسار بصري:** قبل → أثناء → بعد؛ أي تغير في البيانات يجب أن يأتي من حدث فعلي، وليس Timer شكلي.
- **الأوضاع:** Day/Night بنفس بنية JSX، Arabic/English RTL، Low/Reduced motion، 1366×768 دون Page Scroll، الجداول فقط بتمرير داخلي.

## أزرار العمل المطلوبة لهذه الخدمة
1. **Connect Account:** CTA واضح مرتبط بمنطق Google Sheets، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
2. **Choose Resource:** CTA واضح مرتبط بمنطق Google Sheets، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
3. **Prepare API Mutation:** CTA واضح مرتبط بمنطق Google Sheets، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
4. **Confirm Authorized API:** CTA واضح مرتبط بمنطق Google Sheets، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.
5. **Disconnect / Inspect Receipt:** CTA واضح مرتبط بمنطق Google Sheets، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.

## رحلة المستخدم
1. **Select:** اختَر المصدر والعنصر أو القاعدة الخاصة بـ Google Sheets، واعرض Preview لما سيُقاس أو يتغير.
2. **Measure:** احصل على قياسات/عناصر حقيقية من Provider معروف؛ تحديث أحداث Incremental وإيقاف Cancel.
3. **Review:** اعرض item count وCoverage وDiff وRisk قبل أي أثر.
4. **Act:** External connector: OAuth scopes, resource selection, API request consent and checked results; no live account use without authorization.
5. **Follow:** timeline للحالات idle/scoping/measuring/preview/consent/running/verifying/success/partial/cancelled/failed.
6. **Finish:** سجل نتائج مؤرخ، Postcondition موضوعي، Undo فقط إذا أثبت السجل عكس العملية بأمان.
7. **Next:** اقترح خدمة مرتبطة تؤدي العملية التالية مع نقل النطاق المختار، دون تشغيل غير مصرّح به تلقائيًا.

## الربط بالواقع الحالي — من جرد المستودع، ليس اختراعًا
- **المزوّد المسجل:** Google Sheets API v4 read-only via main-process OAuth + DPAPI safeStorage
- **UI/Executor المسجل:** Explicit Connect Google, add spreadsheet URL/ID, refresh metadata, read bounded A1 range, disconnect
- **موافقة/استعادة مسجلة:** Explicit browser OAuth consent; four fixed scopes; no access/refresh token in renderer
- **دليل سابق مسجل:** test:google 14 checks + dev/packaged smoke googleOk (disconnected); live proof NOT PERFORMED
- **حالة المنتج المسجلة:** CONNECTABLE_AWAITING_CONSENT — offline-tested; live browser consent and real Sheets read await owner approval
- **Workbench ledger:** CONNECTABLE_AWAITING_CONSENT
- أعد فحص provider وIPC الحي في الكود عند التنفيذ؛ كلمات AUDIT_REQUIRED أو NONE ليست مصدر API تخميني.

## إثبات القبول المطلوب لهذا المعرف
- OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token.
- أزرار الخدمة متصلة بوظائفها الحقيقية أو BLOCKED وسبب محدد وزر بديل مفيد، وليس Placeholder.
- Fixture E2E: correct result + empty + denied + interrupted + retry + partial + stale plan + disabled permission + optional recovery.
- اختبر عجلة القسم وفتح Workbench side/expanded، حفظ selection والتمرير الداخلي، keyboard/Escape، aria-live وReduced Motion.
- للعمل المؤثر: خطّة ثابتة البصمة، الموافقة المباشرة وقت التنفيذ، تحقق native postcondition والإيصال/التراجع الحقيقي.
- اختم بحالة SPEC_DEFINED أولًا، ولا ترفع إلى IMPLEMENTED_VERIFIED دون commit/fixture proof/screenshots/Windows packaging evidence.

## حدود الأمان
هذه مواصفات تنفيذ لا تصريح لتغيير ملفات المالك أو Registry أو Services أو البرامج أو حساباته. اختبر آثار Windows على disposable fixtures وMock/VM، وأطلب الموافقة في وقت العملية. Class A لا يحتاج mutation لكنه يحتاج تفاعلًا حقيقيًا ولا يبقى Dashboard خاملة.

## سيناريو تنفيذ مُتخصص — إلزامي (Owner quality bar)
**Live scene:** Google Sheets Live Sheet Canvas: حساب مخول، Spreadsheet ID، Range، وصفوف مرتبطة بالأذونات والحصص.

**Exact interaction flow:**
1. Connect with PKCE
2. Select sheet+range
3. Refresh read proof
4. Draft bounded write with scope consent
5. Confirm official Sheets API

**Evidence & negative tests:** لا تدعِ الكتابة من Scope read-only؛ يجب وجود نطاق كتابة منفصل وبموافقة جديدة.

**Non-negotiable:** هذه الشاشة لا تكتمل برسمة؛ يلزم مزود فعلي + state transitions صادقة + اختبارات fixtures + إيصال عملية أو قياس حقيقي.
