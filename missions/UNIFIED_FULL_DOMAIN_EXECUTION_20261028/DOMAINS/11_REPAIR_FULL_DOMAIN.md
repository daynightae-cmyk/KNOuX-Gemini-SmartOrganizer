# FULL DOMAIN DELIVERY 11: Recovery & Repair Lab

THIS IS ONE COMPLETE EXECUTABLE DOMAIN ASSIGNMENT; ALL 12 EXACT SERVICES IN SCOPE. NO SUBMISSION OF ONLY FIRST 2-3 SERVICES AS FINAL.

## A. Complete product and visual intent
معمل تشخيص وإصلاح موجّه يعرض السبب، ترتيب خطوات العلاج، نتائج الأمر المعتمد وسجل الخطر والإعادة، وليس مجرد أزرار SFC.

## B. End-to-end user journey and working controls
Diagnose → choose allowlisted playbook → exact effects/UAC/reboot preview → consent → fixed runner → live transcript → post-check and partial state.

## C. Native / IPC, permissions, effects, and data provenance
Only allowlisted SFC/DISM/network fixed commands in disposable/mock/approved VM; privileged owner effects separately authorized.

## D. Domain-specific destructive/racy edge cases
denied UAC, DISM missing source, reboot pending, failure exit code, irreversibility, timeout and wrong diagnosis.

## E. Common quality bar applying to EVERY service
Build unique live scene with actual backend measurements, meaningful action dock and service-specific inspector. Read source and consent. For effects, plan, request permission, execute in fixture/VM, verify outcome and Undo safety. Support empty, loading, blocked, partial, failed, cancelled, success; preserve progress through restart. No fake readings or fake operation success.
Integrate panel, route, orbital control and full detail workbench; controls keyboard-accessible. Keep DAY/NIGHT, EN/AR RTL, reduced-motion, fixed viewport and inner scrolling. Test Main+Preload+Renderer and Native fixtures, permissions, cancel, rollback, crash, timeouts, and visual geometry. Protect all previously accepted domains.

## F. ALL service IDs and required deliverables

### 1. DISM CheckHealth Diagnostic Console [repair-component-check]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: رادار تشخيص تدريجي تظهر فيه الأدلة وسبب التوصية
ALL REQUIRED INTERACTION BUTTONS: Start Diagnostic | Inspect Proof | Compare Baseline | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: الأدلة المقروءة تقود إلى إجراء حقيقي لا تصنع مؤشر صحة مزيفًا
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-component-check.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-component-check in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 2. DISM ScanHealth 7-Stage Console [repair-component-scan]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: رادار تشخيص تدريجي تظهر فيه الأدلة وسبب التوصية
ALL REQUIRED INTERACTION BUTTONS: Start Diagnostic | Inspect Proof | Compare Baseline | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: الأدلة المقروءة تقود إلى إجراء حقيقي لا تصنع مؤشر صحة مزيفًا
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-component-scan.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-component-scan in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 3. DISM RestoreHealth System Repair Wizard [repair-component-restore]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: سجل تراجع ذكي يعرض Source وDestination لكل تغيير وأي تعارضات جديدة
ALL REQUIRED INTERACTION BUTTONS: Review Receipt | Check Undo Safety | Preview Inverse Diff | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: يلزم إثبات رجوع البصمة والحالة السابقة دون الكتابة فوق تعديل أحدث
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-component-restore.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-component-restore in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 4. SFC VerifyOnly File Integrity Shield [repair-files-verify]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خريطة ملفات ومجلدات من المصدر إلى الوجهة مع معاينة التغيير
ALL REQUIRED INTERACTION BUTTONS: Authorize Source | Inspect Matched Files | Preview Source to Target | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: البيانات الحقيقية محفوظة، اختبارات ملف مقفل/تعارض/Undo على Temp Fixtures
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-files-verify.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-files-verify in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 5. SFC ScanNow Protected File Repair Wizard [repair-files-repair]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خريطة ملفات ومجلدات من المصدر إلى الوجهة مع معاينة التغيير
ALL REQUIRED INTERACTION BUTTONS: Authorize Source | Inspect Matched Files | Preview Source to Target | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: البيانات الحقيقية محفوظة، اختبارات ملف مقفل/تعارض/Undo على Temp Fixtures
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-files-repair.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-files-repair in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 6. DNS Resolver Cache Refresh Preview [repair-dns-flush]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة مقارنة قبل/بعد ذات أسهم Source→Target وتقييم تعارضات
ALL REQUIRED INTERACTION BUTTONS: Choose Items | Generate Exact Plan | Inspect Risk & Conflicts | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: Fingerprint كامل للخطة وإبطال التنفيذ عند تغير الملفات أو الإذن
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-dns-flush.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-dns-flush in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 7. Winsock Catalog Disruption Risk Review [repair-winsock-reset]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-winsock-reset.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-winsock-reset in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 8. TCP/IP Stack Reset Configuration Diff [repair-tcpip-reset]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة TCP/IP Stack Reset Configuration Diff مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-tcpip-reset.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-tcpip-reset in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 9. System Repair Audit Journal [repair-history]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل
ALL REQUIRED INTERACTION BUTTONS: Load Real Events | Filter Timeline | Inspect Event | Export / Open Owning Service
SERVICE-SPECIFIC PROOF: هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-history.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-history in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 10. Windows Troubleshooter Gateway [repair-troubleshooters]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Windows Troubleshooter Gateway مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-troubleshooters.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-troubleshooters in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 11. System Restore Point Inspector [repair-restore-point]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: سجل تراجع ذكي يعرض Source وDestination لكل تغيير وأي تعارضات جديدة
ALL REQUIRED INTERACTION BUTTONS: Review Receipt | Check Undo Safety | Preview Inverse Diff | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: يلزم إثبات رجوع البصمة والحالة السابقة دون الكتابة فوق تعديل أحدث
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-restore-point.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-restore-point in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 12. Windows Update Servicing Reset Wizard [repair-update-reset]
Native/source baseline: AUDIT_REQUIRED. UI baseline: AUDIT_REQUIRED. State before this new domain: AUDIT_REQUIRED.
SERVICE-SPECIFIC PREVIEW: لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة Windows Update Servicing Reset Wizard مع اختيار النطاق والنتائج الفعلية
ALL REQUIRED INTERACTION BUTTONS: Choose Scope | Start Real Operation | Inspect Result | Confirm Privileged Run | Verify Result / Recovery
SERVICE-SPECIFIC PROOF: النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/11_REPAIR/repair-update-reset.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row repair-update-reset in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

## G. MANDATORY full-domain closeout, not a partial wave
1. Reconcile all 12 service IDs in route/registry/native capabilities; there is no skipped ID.
2. Implement ALL native/visual/actions of this domain, including unique preview and controls per service; solve in internal logical commits while status remains IN_PROGRESS.
3. Run native fixture/negative tests, security allowlist and application Main+Preload+Renderer E2E, DAY/NIGHT EN/AR RTL responsive captures, reduced-motion, performance.
4. Inspect previous integrated domains for regression; no visual fixes are allowed to break their actions/consent/source identities.
5. Commit named source code, tests, screenshots, receipts and updated exact service acceptance rows on local integration branch; avoid committing generated sensitive data/keys or uncontrolled evidence.
6. If development occurred elsewhere, reconcile merge conflicts manually and merge before moving to next domain. Verify final ancestry+HEAD and run tests post-merge.
7. Report actual count implemented / externally blocked, action receipts, error paths, non-testable manual gates, final unified SHA. No DONE with missing items.

Domain status until all gates: DOMAIN_NOT_YET_COMPLETED.
