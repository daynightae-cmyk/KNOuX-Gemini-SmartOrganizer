OWNER OVERRIDE 2026-10-28: MAIN-FIRST final cutover. Any older language treating integration branch as permanent target is superseded by 08_MAIN_FIRST_MANDATE.md. M0 requires full WIP reconciliation, verified local main promotion + canonical checkout main and normal origin/main sync before new domain. After each entire domain commit directly on main and synchronize normally.

# FULL DOMAIN DELIVERY 05: Applications

THIS IS ONE COMPLETE EXECUTABLE DOMAIN ASSIGNMENT; ALL 12 EXACT SERVICES IN SCOPE. NO SUBMISSION OF ONLY FIRST 2-3 SERVICES AS FINAL.

## A. Complete product and visual intent
إدارة تطبيقات Windows بمعيار مدير إزالة احترافي: هوية الناشر، التوقيع، حزم البرامج، الفهرس، خطط التحديث والإزالة وآثارها.

## B. End-to-end user journey and working controls
Inventory → select exact application → inspect installer provenance/dependencies → immutable official uninstall/update plan → UAC consent → execute → inventory verification.

## C. Native / IPC, permissions, effects, and data provenance
Fixed WinGet/MSI/Appx/UninstallRegistry adapters; do not pretend deleting a folder uninstalls the program.

## D. Domain-specific destructive/racy edge cases
protected app, unsigned installer, pending reboot, UAC decline, process hang, wrong app ID, partial uninstall.

## E. Common quality bar applying to EVERY service
Build unique live scene with actual backend measurements, meaningful action dock and service-specific inspector. Read source and consent. For effects, plan, request permission, execute in fixture/VM, verify outcome and Undo safety. Support empty, loading, blocked, partial, failed, cancelled, success; preserve progress through restart. No fake readings or fake operation success.
Integrate panel, route, orbital control and full detail workbench; controls keyboard-accessible. Keep DAY/NIGHT, EN/AR RTL, reduced-motion, fixed viewport and inner scrolling. Test Main+Preload+Renderer and Native fixtures, permissions, cancel, rollback, crash, timeouts, and visual geometry. Protect all previously accepted domains.

## F. ALL service IDs and required deliverables

### 1. Installed Applications Register [app-inventory]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: بطاقة برنامج موسعة لمصدر التثبيت والإصدار والناشر والقرارات
ALL REQUIRED INTERACTION BUTTONS: Inspect Inventory | Verify Signer | Stage Official Operation | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: توافق Windows وWinGet/Uninstaller الرسمي ونتيجة إجراء فعلية
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-inventory.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-inventory in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 2. App Identity & Authenticode Trust [app-identity]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: بطاقة برنامج موسعة لمصدر التثبيت والإصدار والناشر والقرارات
ALL REQUIRED INTERACTION BUTTONS: Inspect Inventory | Verify Signer | Stage Official Operation | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: توافق Windows وWinGet/Uninstaller الرسمي ونتيجة إجراء فعلية
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-identity.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-identity in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 3. Multi-Parameter Software Search [app-search]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: فهرس قابل للبحث والفرز والمقارنة مع بطاقة تفصيل ديناميكية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Run Targeted Query | Inspect Row | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: تتبع النتائج المؤرخة ونتيجة ضغط الزر والمرشح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-search.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-search in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 4. Publisher Intelligence & Reputation [app-publisher]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: بطاقة برنامج موسعة لمصدر التثبيت والإصدار والناشر والقرارات
ALL REQUIRED INTERACTION BUTTONS: Inspect Inventory | Verify Signer | Stage Official Operation | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: توافق Windows وWinGet/Uninstaller الرسمي ونتيجة إجراء فعلية
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-publisher.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-publisher in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 5. Recently Changed Applications [app-recent]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-recent.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-recent in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 6. Bulk Uninstall Queue & Batch Manager [app-uninstall-queue]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة مقارنة قبل/بعد ذات أسهم Source→Target وتقييم تعارضات
ALL REQUIRED INTERACTION BUTTONS: Choose Items | Generate Exact Plan | Inspect Risk & Conflicts | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: Fingerprint كامل للخطة وإبطال التنفيذ عند تغير الملفات أو الإذن
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-uninstall-queue.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-uninstall-queue in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 7. Orphaned Leftover Trace Analysis [app-leftovers]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Orphaned Leftover Trace Analysis مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-leftovers.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-leftovers in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 8. Software Update Center [app-updates]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Software Update Center مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-updates.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-updates in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 9. Software Storage Footprint Treemap [app-size]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: فهرس قابل للبحث والفرز والمقارنة مع بطاقة تفصيل ديناميكية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Run Targeted Query | Inspect Row | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: تتبع النتائج المؤرخة ونتيجة ضغط الزر والمرشح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-size.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-size in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 10. Package Center & WinGet Browser [app-store-packages]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: بطاقة برنامج موسعة لمصدر التثبيت والإصدار والناشر والقرارات
ALL REQUIRED INTERACTION BUTTONS: Inspect Inventory | Verify Signer | Stage Official Operation | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: توافق Windows وWinGet/Uninstaller الرسمي ونتيجة إجراء فعلية
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-store-packages.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-store-packages in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 11. File Extension & Protocol Matrix [app-associations]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خريطة ملفات ومجلدات من المصدر إلى الوجهة مع معاينة التغيير
ALL REQUIRED INTERACTION BUTTONS: Authorize Source | Inspect Matched Files | Preview Source to Target | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: البيانات الحقيقية محفوظة، اختبارات ملف مقفل/تعارض/Undo على Temp Fixtures
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-associations.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-associations in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 12. Software Boot Impact Analyzer [app-startup-impact]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: رادار تشخيص تدريجي تظهر فيه الأدلة وسبب التوصية
ALL REQUIRED INTERACTION BUTTONS: Start Diagnostic | Inspect Proof | Compare Baseline | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: الأدلة المقروءة تقود إلى إجراء حقيقي لا تصنع مؤشر صحة مزيفًا
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/05_APPLICATIONS/app-startup-impact.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row app-startup-impact in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

## G. MANDATORY full-domain closeout, not a partial wave
1. Reconcile all 12 service IDs in route/registry/native capabilities; there is no skipped ID.
2. Implement ALL native/visual/actions of this domain, including unique preview and controls per service; solve in internal logical commits while status remains IN_PROGRESS.
3. Run native fixture/negative tests, security allowlist and application Main+Preload+Renderer E2E, DAY/NIGHT EN/AR RTL responsive captures, reduced-motion, performance.
4. Inspect previous integrated domains for regression; no visual fixes are allowed to break their actions/consent/source identities.
5. Commit named source code, tests, screenshots, receipts and updated exact service acceptance rows on local main branch; avoid committing generated sensitive data/keys or uncontrolled evidence.
6. If development occurred elsewhere, reconcile merge conflicts manually and merge before moving to next domain. Verify final ancestry+HEAD and run tests post-merge.
7. Report actual count implemented / externally blocked, action receipts, error paths, non-testable manual gates, final unified SHA. No DONE with missing items.

Domain status until all gates: DOMAIN_NOT_YET_COMPLETED.
