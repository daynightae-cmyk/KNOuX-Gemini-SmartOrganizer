# coding: utf-8
"""KNOuX per-service real preview mission pack. Documentation generator ONLY."""
from pathlib import Path
from collections import Counter
import re,csv,json,hashlib
R=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer")
ROOT=R/"missions"/"SERVICE_PREVIEW_LIVE_EXECUTION_20261027"
SOURCE=R/"docs"/"SERVICE_CAPABILITY_MATRIX.md"
WB=R/"docs"/"SERVICE_WORKBENCH_ACCEPTANCE.md"
REG=R/"docs"/"SERVICE_REGISTRY_EVIDENCE.md"
D=[
("01","HOME_COMMAND_CENTER","Home / Command Deck","Mission Control Bridge","ساحة قيادة KPI حقيقية ولوحة قرارات وشريط نشاط مستمر يفتح خدمة التنفيذ المالكة","نقاط حركة بين عناصر Command Deck حسب الأحداث الحقيقية","Choose section; measure KPIs; inspect event; open owning tool; review pending plan","المؤشرات، مصدر الرقم، آخر تحديث، حالة المهمة المنتظرة"),
("02","SMART_SCAN","Smart Scan","Scanning Radar","رادار مسح للمجلد المخول مع مجموعات نتائج تتكون عند وصول دفعات الملفات","شعاع وقمم صغيرة تسير بنسب العمل المكتمل الفعلية لا Progress مصطنع","Select scan scope; Quick/Deep; inspect discoveries; cancel; route fix","عناصر حقيقية مع المسارات ودرجة اكتمال النطاق"),
("03","ORGANIZATION_STUDIO","Organization Studio","Organization Atelier","سير ملفات مصنفة يتحول إلى قوائم Photos/Videos/Documents ثم خريطة Source-to-Destination قبل التطبيق","مكعبات مصغرة تنتقل إلى الفئة الصحيحة بعد قياس التصنيف، وتتوقف عند التعارض","Choose source; design rules; build plan; approve move; journal; undo","التعارضات، المجلدات النهائية، البصمات وإمكانية الاستعادة"),
("04","GOOGLE_WORKSPACE","Google Workspace","Connected API Bridge","بطاقات موارد الحساب المصرح به وخرائط طلبات API المستجيبة فعلا وصلاحيات OAuth المحددة","أنوار الربط لا تنشط قبل وصول API response حقيقي","Connect; select resource; preview API operation; confirm; refresh; disconnect","نوع الصلاحيات وحصص API وحالة الطلب والموارد"),
("05","APPLICATIONS","Applications","Software Dossier","رف البرامج الحقيقية مع Publisher وSignature وVersion وحجم كل برنامج وخطة الإزالة/التحديث الدقيقة","بطاقة البرنامج تتحول إلى Verified Installed/Removed فقط بعد re-read فعلي","Inventory; inspect; verify signature; plan install/uninstall; confirm; verify","توقيع الناشر ومصدر التثبيت وإجراءات الموافقة"),
("06","FILES","Files / Instant Search","File Intelligence Chamber","فهرس بحث فوري بجداول نتائج قابلة للاختيار ومفتش الملف ومعاينة المصدر والهدف","الصفوف والمصغرات تظهر مع دفعات الفهرس، ولا يحجب glow أسماء الملفات","Choose source; search; inspect; preview rename/move; approve; undo","التجزئة وحجم الملف والمسارات ومخرجات التنفيذ"),
("07","STORAGE","Storage Atlas","Capacity Topographic Map","خريطة Treemap تتوسع مع قياس أحجام المجلدات الفعلية، مع تمييز المساحة الفارغة والقابلة للاسترداد","موجة تعبئة القطاعات فقط حسب عينات التحليل الفعلية","Select volume; analyze; inspect heavy groups; stage reclaim; approve in Cleanup","بايتات مثبتة، بيانات قرص حقيقية، غير معروف لا يعرض 0"),
("08","CLEANUP","Cleanup Vault","Safe Quarantine Lab","شريط مرشحات التنظيف بميزان مخاطر وخريطة Before/After وخزنة استعادة","الملف ينتقل إلى Vault عند نجاح عملية Quarantine فقط","Scan; select candidates; review risk; quarantine; restore; verify reclaim","الملفات المحمية ومجموع البايتات الفعلية وسجل الاستعادة"),
("09","STARTUP","Startup Control","Bootline Timeline","سجل Autorun وScheduled Tasks وSCM مرتب على خط الإقلاع مع خطة تغيير حالة دقيقة","نبض حالة عنصر الإقلاع بعد إعادة قراءة Windows فقط","Inspect autorun; stage disable/enable/delay; approve; verify; restore","المصدر واسم المهمة وبصمة الإعداد القديم والمخاطر"),
("10","SYSTEM","System Observatory","Live Measurement Deck","أجهزة قياس أصلية قابلة للحفر للعمليات والشبكة والعتاد، بوقت عينة وحد تغطية","Graph streaming حقيقي، وحساسات غير مدعومة تعرض Unavailable","Measure live; pause monitor; inspect sample; compare range; export/handoff","العينات، تكرار القياس، مصدر WMI/CIM أو API"),
("11","REPAIR","Repair Lab","Guided Rescue Sequence","تسلسل تشخيص وإصلاح متدرج بملخص الأمر المعتمد ومخرجات runner الحقيقية","خطوات الإصلاح تضيء عند وصول stdout/stderr أو status من التنفيذ المعتمد","Diagnose; prepare exact command plan; inspect impact; approve UAC; run; postcheck","الدليل قبل/بعد، هل يلزم Reboot، وما لا يمكن التراجع عنه"),
("12","SERVICES","Windows Services","SCM Dependency Galaxy","شبكة علاقات الخدمة الأم والتابعة مع الحالة الفعلية ونافذة أثر إيقاف/تشغيل/تعديل","العقد تنبض مع re-read/SCM event وليس حركة منفصلة عن الواقع","Choose service; trace dependent chain; stage control; approve; reread","اسم خدمة SCM الدقيق والخدمات التابعة والمحمية"),
("13","AUTOMATION","Automation Studio","Workflow Flight Deck","محرر DAG مرئي يُظهِر Trigger→Queue→Worker→Receipt مع عرض Next Run حقيقي","العقد المتصلة تتحرك عند تلقي trigger أو worker event فقط","Compose workflow; validate; simulate; schedule; approve; pause/resume; inspect journal","جذر كل مشغل وحالات Retry وFailure وQuiet Hours"),
("14","SETTINGS_ASSISTANT","Settings & Assistant","Preference & AI Lab","معاينة مقارنة للإعدادات واللغة والثيم مع حدود واجهات AI وسجل أدواته المصرح بها","المعاينة تتغير فورًا لكن الحفظ لا يتم إلا بعد Apply","Preview changes; apply; undo prefs; test provider; revoke; export/import","الدلتا الفعلية والأسرار المحجوبة والتأثير على الواجهة")]
DOM={row[0]:row for row in D}
PATTERNS=[
(r"undo|rollback|restore|restoration|recovery","سجل تراجع ذكي يعرض Source وDestination لكل تغيير وأي تعارضات جديدة",
["Review Receipt","Check Undo Safety","Preview Inverse Diff","Confirm Restore"],"يلزم إثبات رجوع البصمة والحالة السابقة دون الكتابة فوق تعديل أحدث"),
(r"quarantine|vault","Vault ثلاثي المناطق: المرشح، الحالة المعزولة، الاستعادة",
["Inspect Candidate","Build Quarantine Plan","Approve Move to Vault","Restore Selection"],"تحقق نقل فعلي إلى مساحة Fixture مع إمكانية استعادة محفوظة"),
(r"duplicate|hash|cryptographic","مجموعات مكررات بألوان حسب بصمات SHA-256، مع اختيار Keeper",
["Select Search Root","Compute Verified Hashes","Choose Keepers","Review Safe Operation"],"ممنوع حذف كل نسخ المكرر، ويجب إثبات تساوي Bytes"),
(r"plan|builder|composer|staging|queue|batch|preview|basket","لوحة مقارنة قبل/بعد ذات أسهم Source→Target وتقييم تعارضات",
["Choose Items","Generate Exact Plan","Inspect Risk & Conflicts","Approve Exact Plan"],"Fingerprint كامل للخطة وإبطال التنفيذ عند تغير الملفات أو الإذن"),
(r"timeline|history|journal|event|log|recent|report","خط أحداث قابل للتصفية والتصدير مع Evidence Inspector لكل سجل",
["Load Real Events","Filter Timeline","Inspect Event","Export Evidence"],"هوية الحدث والتاريخ والمصدر الحقيقي محفوظة مع سجل إعادة فتح"),
(r"thermal|pulse|throughput|performance|sensor|traffic|resources|cycles","قياسات رقمية حيّة على رسم زمني بانتقال سلس وثابت المصدر",
["Begin Sampling","Change Interval","Inspect Spike","Export Samples"],"لا قيم حرارة/صحة مختلقة؛ العينات مؤرخة ومصدرها ظاهر"),
(r"dns|network|wifi|adapter|connectivity|route|ports|socket|topology|proxy|hosts|interfaces","شبكة مسارات اتصالات قابلة للتحقيق وعرض حالة كل عقدة",
["Select Interface","Run OS Diagnostic","Inspect Hop or Setting","Open Safe Fix Plan"],"إثبات قياس Windows/شبكة حقيقي ورفض/Timeout وOffline"),
(r"schedule|calendar|quiet.hours|recurrence|cron|battery|power.aware","ساعة 24h وجداول trigger تعرض التوقيت التالي وفق منطقة المستخدم",
["Set Rules","Preview Upcoming Runs","Validate Guardrails","Save Schedule"],"اختبار VirtualClock وDST والسكون واستئناف المواعيد"),
(r"google|gmail|sheets|chat|contacts|classroom|slides|picker|forms|tasks","مخطط حساب→OAuth Scope→Resource→API Operation مع عقد وصول ورفض واضحة",
["Connect Account","Choose Resource","Prepare API Mutation","Approve API Call"],"OAuth مضبوط النطاق، رفض 401/403/429 وفصل اتصال مع عدم تسريب Token"),
(r"file|folder|source|destination|collection|organization|archive|download","خريطة ملفات ومجلدات من المصدر إلى الوجهة مع معاينة التغيير",
["Authorize Source","Inspect Matched Files","Preview Source to Target","Apply Approved Operation"],"البيانات الحقيقية محفوظة، اختبارات ملف مقفل/تعارض/Undo على Temp Fixtures"),
(r"service|scm|svchost|dependent|dependency","شبكة تبعية خدمات Windows وموجة تأثير على المكونات التابعة",
["Select Service","Inspect Dependencies","Stage Authorized Change","Verify SCM State"],"Fake SCM/VM ولا توقف خدمة محمية حقيقية"),
(r"app|uninstall|winget|publisher|package|signature|association","بطاقة برنامج موسعة لمصدر التثبيت والإصدار والناشر والقرارات",
["Inspect Inventory","Verify Signer","Stage Official Operation","Verify Installed State"],"توافق Windows وWinGet/Uninstaller الرسمي ونتيجة إجراء فعلية"),
(r"search|finder|filter|inventory|register|explorer|atlas|map|ledger","فهرس قابل للبحث والفرز والمقارنة مع بطاقة تفصيل ديناميكية",
["Choose Scope","Run Targeted Query","Inspect Row","Export or Route Action"],"تتبع النتائج المؤرخة ونتيجة ضغط الزر والمرشح"),
(r"privacy|health|trust|integrity|diagnostic|check|inspect|analyze","رادار تشخيص تدريجي تظهر فيه الأدلة وسبب التوصية",
["Start Diagnostic","Inspect Proof","Compare Baseline","Open Follow-Up Tool"],"الأدلة المقروءة تقود إلى إجراء حقيقي لا تصنع مؤشر صحة مزيفًا")]
def table(path):
 result=[]
 for ln in path.read_text(encoding="utf-8-sig").splitlines():
  if re.match(r"^\|\s*\d\d\s*\|",ln):
   result.append([v.strip() for v in ln.strip().strip("|").split("|")])
 return result
rows=table(SOURCE)
wb={r[1]:r for r in table(WB)}
assert len(rows)==181,("wrong row count",len(rows))
assert len(set(r[1] for r in rows))==181
assert all(len(x)>=10 for x in rows)
assert len([p for p in ROOT.rglob("*.md")])==0,"Target already contains documents; cannot overwrite"
def write(rel,body):
 path=ROOT/rel;path.parent.mkdir(parents=True,exist_ok=True)
 assert not path.exists(),str(path)
 path.write_text(body.strip()+"\n",encoding="utf-8")
 return rel
def match(title):
 for p,scene,buttons,proof in PATTERNS:
  if re.search(p,title,re.I):return scene,buttons,proof
 return ("لوحة تشغيل مفصلة تقدم قياسات وأحداث خدمة "+title+" مع اختيار النطاق والنتائج الفعلية",
 ["Choose Scope","Start Real Operation","Inspect Result","Open Next Action"],"النتيجة مرتبطة بمزود حقيقي ومثبتة بإيصال Postcondition")
records=[]
cnt=Counter()
for row in rows:
 mission,sid,title,cls,old,provider,existing,consent,tests,status=row[:10]
 m,folder,label,metaphor,stage,motion,general,inspector=DOM[mission]
 cnt[mission]+=1
 scene,buttons,proof=match(title)
 service_kind={
 "A":"Actionable observation: sampling, filtering, scope selection, exporting, drilldown and verified handoff are actual actions; do not force destructive mutation on read-only instrumentation.",
 "B":"Reviewed user-controlled action with immutable before/after plan, consent, progress, journal and undo if genuinely reversible.",
 "C":"Risky/privileged or nonreversible action: permission check, protected-target denial, UAC/reboot disclosure, explicit approval and truthful after-state.",
 "D":"External connector: OAuth scopes, resource selection, API request consent and checked results; no live account use without authorization."
 }[cls]
 if cls=="A":buttons=buttons[:3]+["Export / Open Owning Service"]
 if cls=="B":buttons=buttons[:3]+["Approve Action","Verify and Undo if Safe"]
 if cls=="C":buttons=buttons[:3]+["Confirm Privileged Run","Verify Result / Recovery"]
 if cls=="D":buttons=buttons[:3]+["Confirm Authorized API","Disconnect / Inspect Receipt"]
 if len(buttons)!=5 and cls!="A":raise ValueError(title)
 # Individually named actions and previews; retain exact past provider and status as evidence, not endorsements.
 desc=f"""# {title} — SERVICE EXPERIENCE SPEC
**Exact ID:** {sid} | **Mission:** {mission} — {label} | **Provisional class:** {cls}

## الفكرة المميزة / Why this service feels alive
خدمة {title} تفتح تجربة مستقلة في {metaphor}، وليس مجرد Card رقمية. بدلاً من مشاهدة تقرير جامد، يحدد المستخدم نطاق الخدمة، يرى ما يُفحص أو يتغير وما مصدر المعلومة، ويتخذ إجراءً واضحًا في نفس مساحة العمل.

## المسرح والتفاعل الخاص بالخدمة
- **Primary live preview:** {scene}.
- **الشخصية البصرية للقسم:** {stage}.
- **Microanimation مرتبطة بالواقع:** {motion}.
- **Inspector سياقي:** {inspector}.
- **عرض المصدر:** اسم provider، توقيت آخر عينة، النطاق، حالات denied/unavailable، Badge يميز LIVE NATIVE عن TEST FIXTURE أو DESIGN DEMO.
- **مسار بصري:** قبل → أثناء → بعد؛ أي تغير في البيانات يجب أن يأتي من حدث فعلي، وليس Timer شكلي.
- **الأوضاع:** Day/Night بنفس بنية JSX، Arabic/English RTL، Low/Reduced motion، 1366×768 دون Page Scroll، الجداول فقط بتمرير داخلي.

## أزرار العمل الخمسة المطلوبة لهذه الخدمة
"""
 for i,b in enumerate(buttons,1):
  desc+=f"{i}. **{b}:** CTA واضح مرتبط بمنطق {title}، يبيّن ما إذا كانت العملية جاهزة، أو تحتاج موافقة، أو مفقود native handler؛ لا يعلن نجاحًا دون receipt.\n"
 desc+=f"""
## رحلة المستخدم
1. **Select:** اختَر المصدر والعنصر أو القاعدة الخاصة بـ {title}، واعرض Preview لما سيُقاس أو يتغير.
2. **Measure:** احصل على قياسات/عناصر حقيقية من Provider معروف؛ تحديث أحداث Incremental وإيقاف Cancel.
3. **Review:** اعرض item count وCoverage وDiff وRisk قبل أي أثر.
4. **Act:** {service_kind}
5. **Follow:** timeline للحالات idle/scoping/measuring/preview/consent/running/verifying/success/partial/cancelled/failed.
6. **Finish:** سجل نتائج مؤرخ، Postcondition موضوعي، Undo فقط إذا أثبت السجل عكس العملية بأمان.
7. **Next:** اقترح خدمة مرتبطة تؤدي العملية التالية مع نقل النطاق المختار، دون تشغيل غير مصرّح به تلقائيًا.

## الربط بالواقع الحالي — من جرد المستودع، ليس اختراعًا
- **المزوّد المسجل:** {provider}
- **UI/Executor المسجل:** {existing}
- **موافقة/استعادة مسجلة:** {consent}
- **دليل سابق مسجل:** {tests}
- **حالة المنتج المسجلة:** {status}
- **Workbench ledger:** {wb.get(sid,[""])[-1] if sid in wb else "UNMAPPED_RECONCILE"}
- أعد فحص provider وIPC الحي في الكود عند التنفيذ؛ كلمات AUDIT_REQUIRED أو NONE ليست مصدر API تخميني.

## إثبات القبول المطلوب لهذا المعرف
- {proof}.
- أزرار الخدمة متصلة بوظائفها الحقيقية أو BLOCKED وسبب محدد وزر بديل مفيد، وليس Placeholder.
- Fixture E2E: correct result + empty + denied + interrupted + retry + partial + stale plan + disabled permission + optional recovery.
- اختبر عجلة القسم وفتح Workbench side/expanded، حفظ selection والتمرير الداخلي، keyboard/Escape، aria-live وReduced Motion.
- للعمل المؤثر: خطّة ثابتة البصمة، الموافقة المباشرة وقت التنفيذ، تحقق native postcondition والإيصال/التراجع الحقيقي.
- اختم بحالة SPEC_DEFINED أولًا، ولا ترفع إلى IMPLEMENTED_VERIFIED دون commit/fixture proof/screenshots/Windows packaging evidence.

## حدود الأمان
هذه مواصفات تنفيذ لا تصريح لتغيير ملفات المالك أو Registry أو Services أو البرامج أو حساباته. اختبر آثار Windows على disposable fixtures وMock/VM، وأطلب الموافقة في وقت العملية. Class A لا يحتاج mutation لكنه يحتاج تفاعلًا حقيقيًا ولا يبقى Dashboard خاملة.
"""
 sub=f"services/{mission}_{folder}/{re.sub(r'[^a-zA-Z0-9_-]+','-',sid)}.md"
 write(sub,desc)
 records.append(dict(mission=mission,domain=label,id=sid,name=title,proposedClass=cls,originalStatus=status,workbenchStatus=wb.get(sid,[""])[-1] if sid in wb else "UNMAPPED_RECONCILE",currentProvider=provider,currentAction=existing,consent=consent,sourceTests=tests,preview=scene,buttons=buttons,acceptance=proof,doc=sub,implementation="SPEC_ONLY_NOT_EXECUTED"))
for m,folder,label,metaphor,stage,motion,general,inspector in D:
 rs=[r for r in records if r["mission"]==m]
 lines=["# "+label+" — LIVE DOMAIN PLAYBOOK", "", "## مشهد هذا القسم", "**"+metaphor+"**: "+stage,
 "**التفاعل:** "+motion,"**القرارات:** "+inspector,
 "**سلسلة الأوامر الأصلية:** "+general,
 "",
 "## بناء الشاشات والمقياس",
 "أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.",
 "",
 "## الخدمات الفردية الرسمية ("+str(len(rs))+")"]
 for r in rs:lines.append("- ["+r["name"]+"](../../"+r["doc"]+") — "+r["id"]+" | "+r["proposedClass"]+" | "+r["originalStatus"])
 lines+=["","## حالات القبول", "يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات."]
 write("domains/"+m+"_"+folder+"/00_DOMAIN_PLAYBOOK.md","\n".join(lines))
index=["# KNOuX — LIVE PREVIEW & REAL SERVICE EXECUTION","",
"هذا فولدر المهمة الجديد المنشأ مباشرة على جهاز Windows. **هو مواصفات تنفيذية فعلية وليس كود خدمات منفذًا**. تم استخراج الأسماء والـIDs وحالة كل خدمة من جرد المنتج الأصلي.",
"",
"## ابدأ من هنا","1. 01_MASTER_EXECUTION.md","2. 02_PREVIEW_DESIGN_SYSTEM.md","3. 03_NATIVE_ACTION_CONTRACT.md",
"4. 04_IMPLEMENTATION_SEQUENCE.md","5. 05_ACCEPTANCE_GATE.md",
"6. schemas/SERVICE_CATALOG_181.json وschemas/SERVICE_ACTION_MATRIX_181.csv",
"7. domains/ ثم services/ لكل خدمة.", "",
"## قائمة الأقسام والخدمات", "| Mission | Section | Count | Playbook |", "|---|---|---:|---|"]
for m,folder,label,*_ in D:index.append("| "+m+" | "+label+" | "+str(cnt[m])+" | [افتح](domains/"+m+"_"+folder+"/00_DOMAIN_PLAYBOOK.md) |")
index +=["","**مجموع موثق = "+str(len(records))+" خدمة.** الـ150 سجل Registry مجموعة مختلفة ومتداخلة، وليست 150 خدمة إضافية.",
"كل خدمات A يجب أن تملك إجراءات تفاعلية حقيقية مثل query/measure/filter/export؛ واجهات B/C/D لها Preview وخطة/موافقة وتنفيذ typed provider؛ لا تزييف نجاح ولا تغييرات حقيقية على Windows دون موافقة في لحظتها."]
write("00_START_HERE.md","\n".join(index))
write("01_MASTER_EXECUTION.md","""
# MISSION 16 — Complete real live experience for all 181 services
## Authoritative purpose
حوّل كل خدمة من القراءة الصامتة إلى تجربة تشغيل ذات معنى: نطاق/اختيار، معاينة حيّة واقعية، أدوات عمل ذات قيمة، حالة عمليات، نتيجة وإيصال، وUndo للعمليات القابلة للعكس. لا تجبر خدمة قياس/Class A على تغيير Windows: التفاعل قد يكون بحثًا أو فحصًا أو مقارنة أو تصديرًا أو مسارًا مباشرًا لخدمة التنفيذ.
## Mandatory reads
docs/SERVICE_CAPABILITY_MATRIX.md
docs/SERVICE_WORKBENCH_ACCEPTANCE.md
docs/SERVICE_REGISTRY_EVIDENCE.md
missions/REAL_SERVICE_FUNCTIONALITY_STANDARD.md
missions/15A_INTERACTIVE_SERVICE_WORKBENCHES_MISSION.md
missions/15_REAL_SERVICE_ACTIVATION_MISSION.md
This folder: 00_START_HERE.md, 02–07, 14 Domain Playbooks, each exact service spec.
## Non-negotiables
- Build shared typed Electron operation engine + active UX shell without destroying approved visual layouts Files/Studio/Intro.
- Each service owns ID, source-of-truth provider, scope, preview, CTA enabled rules, permission gate, result proof, cancellation/journal, side/full workbench.
- Actual Class B/C effects only after immutable exact plan, permission and per-action consent. Class D OAuth per scopes/account.
- Emit native events only; never fake file counts, time, % reclaimed or OS success.
- Reuse 181 ID mapping, reconcile with 150 Registry aliases; no hallucinated service endpoints.
- First flagship outcome: select folder → measured file categories → rules → immutable move plan → user approval → fixture real operation → hash/receipt → safe undo.
- Keep every existing agent worktree and WIP. Do not reset/clean/stash/force-push.
## Deliver
Actual React workbenches, bridge providers, operation engine, safe fixtures, tests/screenshots and per-service CSV status updated by SHA. No main merge, public release or privileged personal OS action without separate owner approval.
""")
write("02_PREVIEW_DESIGN_SYSTEM.md","""
# KNOuX Live Preview Design Language
Slogan: المستخدم يرى النطاق، ثم يرى ما يحدث، ثم يملك القرار، ثم يرى الدليل.
## UI shell anatomy
1. Section Hero with contextual measurement, status mode and honest permissions.
2. Orbit / instrument according to approved section design. Home command deck instead of forced wheel.
3. Center LIVE STAGE: unique visualization per service from service_specs, live native event data.
4. Right INSPECTOR with selection, risk, before/after, source timestamps, detailed receipts.
5. Bottom ACTION DOCK with Choose, Start, Pause/Cancel, Preview Changes, Confirm, Retry, Undo when safe.
6. Internal bounded table/list scrolling; no outer page vertical scrolling just to reach actions.
7. Playback control of animation means UI motion, never simulation of an OS effect.
## Component contracts
LiveServiceStage: serviceId, sourceMode, scope, eventStream, error, selected.
SourcePicker: grant/revoke scoped permissions, file IDs, volume/service/app IDs or OAuth resource IDs.
LiveTimeline: chronological real events, phase, processed, total optional, cancel, elapsed.
BeforeAfterLens: exact source→target and immutable plan hashes; compare pre/post status.
RiskConfirmation: irreversible flag, affected count, protected resource, typed permit.
ResultReceipt: success/partial/fail, per-item outcomes, source and target, reversible flag.
OrbitParticleField: glowing microdots and orbital rings follow active phase; disabled by prefers-reduced-motion, paused when hidden.
WorkbenchHost: SIDE / EXPANDED, keyboard focus, persistent filters, pin/unpin.
## Truth badges
LIVE WINDOWS, CONNECTED API, FIXTURE TEST, DESIGN PREVIEW, PERMISSION REQUIRED, PROVIDER UNAVAILABLE. No confusing fixture with owner data.
## Responsive & accessibility
1366x768, 1672x941, 1920x1080; 125%-150% scaling, EN/AR RTL, 14px normal text preferred. Keyboard/ARIA events, visible loading/error, high contrast DAY/NIGHT. Large lists virtualized; CPU timers cleaned up.
""")
write("03_NATIVE_ACTION_CONTRACT.md","""
# Typed Native Actions — exact workflow
Select source → Scope authorization → Real measure → Preview exact plan → Consent → Revalidate plan → Execute fixed operation → Verify postcondition → Journal receipt → Undo if safe.
Typed IPC only via Electron preload with session/sender/origin validation; no generic arbitrary shell, unbounded PowerShell, path traversal, symlink escape or raw token in renderer.
Events schema: opId, serviceId, sourceMode, sequence, phase, completed, total optional, timestamp, provenance, errors, receiptId. If total unknown use indeterminate progress; no invented 83%.
Security classes: A useful non-mutating real actions; B reversible actions with journal; C privileged/irreversible reviewed action with UAC where necessary, no fake undo; D external least-privilege OAuth with revoke, 401/403/429 handling.
Disallow auto-changing real Windows services/startup/registry/uninstall/repair, real user files or connected Google/AI accounts without separately approved runtime action.
Testing ownership: 40+ disposable files, symlink/locked/collision cases, Mock SCM/Registry/Task Scheduler, VM for privileged repairs, offline Google test harness. Verify postcondition not merely successful IPC call.
""")
write("04_IMPLEMENTATION_SEQUENCE.md","""
# Execute in coherent waves — don't build 181 visual demos first
0. Read current git and guard, inspect providers/registry and find actual shared hooks, preserve WIP.
1. Shared event-backed native operation engine + dedicated live stage shell, schema, receipts and permission dialog.
2. Organization Studio + Files effectful apply and undo on disposable folders; expose from Home and Scan.
3. Storage + Cleanup: measured treemap, keepers/duplicates, real quarantines/restores, byte reports.
4. Applications, Startup, Services: official OS APIs/fixed runners + mock/VM effect tests.
5. System + Repair: native observability, valid troubleshooting and fixed/elevated postchecks.
6. Automation: durable queue, scheduled jobs, retries/cancel/idempotency/permissions.
7. Google 10 services + Settings/AI/Home: explicit external consent, real API provider or truly blocked with diagnostic.
8. 181 individual acceptance tests, NIGHT/DAY, EN/AR, 1366/1672/1920, packaged Electron smoke. No release claim until security/installer gates from Production Master.
Always ship a batch with code, proof, journal, modified service statuses; prioritize user's real workflow above generic UI polish.
""")
write("05_ACCEPTANCE_GATE.md","""
# Service acceptance gates — enforce per ID
[ ] Exact serviceId + domain mapping and working navigation from orbital/workbench.
[ ] Data source measured or honest unavailable, timestamp & coverage.
[ ] Unique service preview with state/progress/result tied to native provider, not a looping animation.
[ ] Working meaningful CTA; class A query/refresh/filter/export/handoff; classes B/C/D exact action plan or honestly blocked pending implementation.
[ ] Source/plan consent, effect test on disposable/VM, verified postcondition, partial failures, cancellation.
[ ] Journal and Undo only when verifiably reversible; no loss of user data.
[ ] Workbench pin/expand, keyboard focus, responsive layout, DAY/NIGHT/RTL/reduced motion.
[ ] Negative tests for stale state, missing permission, symlink escape, denied UAC/OAuth, crash/interruption, offline, protected OS service.
[ ] Evidence: SHA, commit, screenshots, exact event log, tested provider, status matrix row, owner outcome.
Do NOT mark PASS because the screen looked good or npm build passed. No backend => BLOCKED WITH REASON and continue implementing.
""")
write("06_DOMAIN_SIGNATURE_SCENES.md","\n".join(["# Visual scene library — 14 distinct stages",""]+["- **"+label+" — "+metaphor+":** "+stage+". Real interaction: "+motion+"." for _,folder,label,metaphor,stage,motion,*rest in D]))
write("07_INITIAL_REALITY_AND_PROVENANCE.md","""
# Reality baseline
This mission pack is generated from the current canonical 181-row product capability matrix, with old provider, UI, consent, tests and status copied into each of 181 spec files.
This is NOT a verification that a specific source code implementation exists today; old fields sometimes say AUDIT_REQUIRED, BLOCKED or PARTIAL.
Docs/SERVICE_REGISTRY_EVIDENCE.md has 150 overlapping registry entries, not 150 additional mission services.
Critical gaps from previous ledger: file organization actual executor & undo; Cleanup quarantine/restore; Windows startup/SCM/uninstall/repair effects; automation execution; Google external APIs; secure AI vault/consent.
Unlike earlier visual-only milestones, release success demands effect receipts from fixtures/Windows and secure consent gates. Browser-only mock image does not prove Windows functionality.
""")
write("08_EXECUTION_AGENT_HANDOFF.md","""
# Short agent handoff
You must IMPLEMENT, not re-author this mission library.
Read 00_START_HERE and 01–07, then domains and service_specs for each ID.
Do not make 181 static cards: implement a real event-driven native preview/action engine and service-specific workflows. Prioritize Studio/Files real file organization+Undo on disposable fixtures, then all remaining 181 entries in dependency order. Preserve Codex visual WIP, no cross-worktree overwrite, no premature green.
At every wave: detailed service IDs completed, actual source→action→postcondition+receipt, tested negative paths, screenshot, exact SHA, remaining blocker. No real owner machine mutation, privileged OS, account OAuth or paid API without explicit authorization. No push/merge to main or public release.
""")
meta={"source_sha256":hashlib.sha256(SOURCE.read_bytes()).hexdigest(),"workbench_sha256":hashlib.sha256(WB.read_bytes()).hexdigest(),"registry_sha256":hashlib.sha256(REG.read_bytes()).hexdigest(),"service_count":len(records),"domain_counts":dict(cnt),"status":"SPECIFICATIONS_ONLY_NO_EXECUTION"}
write("schemas/SOURCE_PROVENANCE.json",json.dumps(meta,ensure_ascii=False,indent=2))
write("schemas/SERVICE_CATALOG_181.json",json.dumps({"schema":1,"note":"Desired UX and canonical baseline; NOT implementation proof","services":records},ensure_ascii=False,indent=2))
with (ROOT/"schemas"/"SERVICE_ACTION_MATRIX_181.csv").open("w",encoding="utf-8-sig",newline="") as f:
 out=csv.writer(f)
 out.writerow(["mission","service_id","name","class","source_status","wb_status","current_provider","current_action","preview","action_buttons","service_spec","implementation"])
 for r in records:out.writerow([r["mission"],r["id"],r["name"],r["proposedClass"],r["originalStatus"],r["workbenchStatus"],r["currentProvider"],r["currentAction"],r["preview"]," | ".join(r["buttons"]),r["doc"],r["implementation"]])
print("ROOT="+str(ROOT))
print("SERVICE_DOCS="+str(len(list((ROOT/"services").rglob("*.md")))))
print("DOMAIN_DOCS="+str(len(list((ROOT/"domains").rglob("*.md")))))
print("FILE_COUNT="+str(len([x for x in ROOT.rglob("*") if x.is_file()])))
print("DOMAIN_COUNTS="+str(dict(cnt)))
