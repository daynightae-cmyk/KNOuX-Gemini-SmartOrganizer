OWNER OVERRIDE 2026-10-28: MAIN-FIRST final cutover. Any older language treating integration branch as permanent target is superseded by 08_MAIN_FIRST_MANDATE.md. M0 requires full WIP reconciliation, verified local main promotion + canonical checkout main and normal origin/main sync before new domain. After each entire domain commit directly on main and synchronize normally.

# FULL DOMAIN DELIVERY 04: Google Workspace

THIS IS ONE COMPLETE EXECUTABLE DOMAIN ASSIGNMENT; ALL 10 EXACT SERVICES IN SCOPE. NO SUBMISSION OF ONLY FIRST 2-3 SERVICES AS FINAL.

## A. Complete product and visual intent
منصة API حقيقية تتعامل مع موارد الحساب المصرّح وتعرض العمليات والحدود والصلاحيات ونتائجها دون وعود وهمية.

## B. End-to-end user journey and working controls
OAuth PKCE → consent scope → choose account/resource → read provenance → preview write action → approval → official API → re-read result.

## C. Native / IPC, permissions, effects, and data provenance
Official APIs, scoped token vault, idempotent write, revoked/expired permissions and rate limits.

## D. Domain-specific destructive/racy edge cases
OAuth cancel, 401,403,429, offline, changed range/ID, quota, token secrets leaked in renderer.

## E. Common quality bar applying to EVERY service
Build unique live scene with actual backend measurements, meaningful action dock and service-specific inspector. Read source and consent. For effects, plan, request permission, execute in fixture/VM, verify outcome and Undo safety. Support empty, loading, blocked, partial, failed, cancelled, success; preserve progress through restart. No fake readings or fake operation success.
Integrate panel, route, orbital control and full detail workbench; controls keyboard-accessible. Keep DAY/NIGHT, EN/AR RTL, reduced-motion, fixed viewport and inner scrolling. Test Main+Preload+Renderer and Native fixtures, permissions, cancel, rollback, crash, timeouts, and visual geometry. Protect all previously accepted domains.

## F. ALL service IDs and required deliverables

### 1. Google Sheets [mission-04-01]
Native/source baseline: Google Sheets API v4 read-only via main-process OAuth + DPAPI safeStorage. UI baseline: Explicit Connect Google, add spreadsheet URL/ID, refresh metadata, read bounded A1 range, disconnect. State before this new domain: CONNECTABLE_AWAITING_CONSENT — offline-tested; live browser consent and real Sheets read await owner approval.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-01.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-01 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 2. Gmail [mission-04-02]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-02.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-02 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 3. Google Tasks [mission-04-03]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-03.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-03 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 4. Google Forms [mission-04-04]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-04.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-04 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 5. Google Contacts [mission-04-05]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-05.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-05 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 6. Google Calendar [mission-04-06]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: ساعة 24h وجداول trigger تعرض التوقيت التالي وفق منطقة المستخدم
ALL REQUIRED INTERACTION BUTTONS: Set Rules | Preview Upcoming Runs | Validate Guardrails | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: اختبار VirtualClock وDST والسكون واستئناف المواعيد
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-06.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-06 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 7. Google Picker [mission-04-07]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-07.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-07 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 8. Google Slides [mission-04-08]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-08.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-08 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 9. Google Chat [mission-04-09]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-09.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-09 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

### 10. Google Classroom [mission-04-10]
Native/source baseline: none — local fixture preview only. UI baseline: Design preview action; no Google provider or scope. State before this new domain: BLOCKED — fixture preview only; live provider and scope not implemented.
SERVICE-SPECIFIC PREVIEW: مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة
ALL REQUIRED INTERACTION BUTTONS: Connect Account | Choose Resource | Prepare API Mutation | Confirm Authorized API | Disconnect / Inspect Receipt
SERVICE-SPECIFIC PROOF: OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token
Individual exact spec: missions/SERVICE_PREVIEW_LIVE_EXECUTION_20261027/services/04_GOOGLE_WORKSPACE/mission-04-10.md
Acceptance obligation: verify source, controls, preview, failure/cancel, native or API effect, receipt, visual day/night, Electron and final integrated SHA. Update exact row mission-04-10 in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv. No unchecked status promotion.

## G. MANDATORY full-domain closeout, not a partial wave
1. Reconcile all 10 service IDs in route/registry/native capabilities; there is no skipped ID.
2. Implement ALL native/visual/actions of this domain, including unique preview and controls per service; solve in internal logical commits while status remains IN_PROGRESS.
3. Run native fixture/negative tests, security allowlist and application Main+Preload+Renderer E2E, DAY/NIGHT EN/AR RTL responsive captures, reduced-motion, performance.
4. Inspect previous integrated domains for regression; no visual fixes are allowed to break their actions/consent/source identities.
5. Commit named source code, tests, screenshots, receipts and updated exact service acceptance rows on local main branch; avoid committing generated sensitive data/keys or uncontrolled evidence.
6. If development occurred elsewhere, reconcile merge conflicts manually and merge before moving to next domain. Verify final ancestry+HEAD and run tests post-merge.
7. Report actual count implemented / externally blocked, action receipts, error paths, non-testable manual gates, final unified SHA. No DONE with missing items.

Domain status until all gates: DOMAIN_NOT_YET_COMPLETED.
