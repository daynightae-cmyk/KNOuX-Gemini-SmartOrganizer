# coding: utf-8
"""Editorial specialization of safety-critical, flagship and end-user workflows.
Only edits docs inside THIS new mission directory. No application files touched.
"""
from pathlib import Path
import re
ROOT=Path(r"D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\missions\SERVICE_PREVIEW_LIVE_EXECUTION_20261027")
# Fields: service ID -> Live visual scene, named interaction controls, acceptance evidence.
SPECIAL={
"mission-03-07":("تنظيم حقيقي كخط إنتاج: يعرض لكل ملف Source → Plan Row → Destination → Copy/Move Commit → Verified. لا تضيء علامة COMPLETE إلا بعد مقارنة Bytes أو Hash فعلي.",
 "Revalidate 40-file disposable plan | Preview every source/destination/conflict | Approve exact immutable plan | Execute move/copy with cancellation | Verify content hash + journal",
 "ثبت حالات: collision rename/skip, symlink escape, file locked, permission denied, partial batch, restart/crash. تستعمل معلومات الملف الأصلية ولا تتلف ملفات المالك."),
"mission-03-08":("Rewind Timeline: يعيد رسم عمليات التنظيم السابقة واحدة واحدة، بأسماء الملفات وسبب أهلية كل Undo وإشارة تحذير عند ظهور تعديل أحدث.",
 "Open durable history | Select operation group | Compare current target fingerprint | Build inverse plan | Approve safe undo + re-hash",
 "Undo للملفات المملوكة في fixture فقط؛ conflict resolution لا يطمس أي تعديل جديد؛ اختبر Journal بعد restart."),
"mission-03-06":("شاشة مراجعة تبدو كخرائط انتقال: مصدر الملف على اليسار والوجهة على اليمين وخطوط التعارض وتبويبات Skip/Rename/Overwrite مع سياسات أمان.",
 "Freeze plan | Inspect 1:1 source-target map | Resolve collisions | Validate target free space | Approve fingerprinted action",
 "إذا تغيّر المصدر بعد إعداد الخطة تُلغى الموافقة ويلزم إعادة المعاينة."),
"file-organize-apply":("من Files: اختيار مجموعة صفوف ثم إظهار Side-by-side Folder Tree قبل وبعد الترتيب، وبعد الموافقة تتابع نقل الملفات وفحصها الحقيقي دون مغادرة نتائج البحث.",
 "Select file rows | Open Studio plan with original scope | Inspect destination conflicts | Confirm selected changes | Show per-file result",
 "أكد حفظ التحديد ومرور معرفات الملفات وسلامة IPC والعنصر الواحد"),
"file-organize-undo":("زر Reverse حقيقي على العملية المختارة فقط، يعرض Delta الدقيقة والملفات التي تغيرت بعد تطبيق التنظيم.",
 "Choose receipt | Revalidate targets | Preview inverse operations | Confirm rollback | Verify old paths restored",
 "لا Undo وهمي بعد نقل ملف يدويًا، أو إذا استعمل مستخدم اسم الوجهة."),
"file-search":("تعقب الفهرس على مستوى المجلد: نتائج تظهر خلال الكتابة بالاسم/الامتداد/الحجم/الزمن مع استجابة متسقة وزر يفتح الملف المحدد أو عمله.",
 "Select indexed roots | Query instantly | Filter/sort | Inspect actual file | Open action workbench",
 "سعة 100k+ fixture، وصول تدريجي وإلغاء بحث قديم دون تغيير نتائج البحث الأحدث."),
"cleanup-temp-quarantine":("سير نقل مرشحات التنظيف من مساحة المصدر إلى Safe Vault؛ عداد المساحة لا يتغير إلا بعد تأكيد انتقال البايتات.",
 "Select reviewed temp candidates | Hash and preview quarantine | Approve scoped transfer | Verify vault items | Offer restore",
 "لا حذف ملفات نظام محمية أو ملفات مستخدم؛ تثبيت استعادة byte-exact."),
"cleanup-temp-undo":("خزنة الاستعادة تكشف تواريخ النقل وأحجام الملفات وتواقيعها؛ عند التراجع تظهر ملفات Recovered بجانب فحص المصدر.",
 "Select vault receipt | Validate destination vacancy | Compare original hash | Approve restore | Confirm checksum",
 "رفض الاستعادة على اسم أصلي مشغول أو مسار لم يعد مفوضًا."),
"cleanup-update-cache":("منطقة Windows servicing منفصلة بخطوط تحذير واضحة: لماذا مساحة Update Cache حساسة ومتى تتيح API نظام معتمد.",
 "Inspect servicing state | Enumerate supported candidates | Simulate approved method | Request privilege only if required | Recheck system health",
 "لا حذف مباشر لمجلد WinSxS أو SoftwareDistribution، ولا pseudo-cleaning Windows Update."),
"app-uninstall-queue":("Shelf ثلاثي المراحل: التطبيقات المختارة، ما سيتبقى بعد إزالة التثبيت، والتقدم الحقيقي لكل MSI/WinGet/Appx مع الأكواد.",
 "Choose exact app IDs | Inspect publisher and official uninstaller | Preview dependent apps | Approve batch | Verify app no longer installed",
 "منع batch silent uninstall للبرامج المحمية؛ لا تعتبر حذف folder نجاح إزالة التثبيت ولا تخترع Undo."),
"app-updates":("مقارنة Upgrade Dossier: إصدار حالي مقابل إصدار معروض من WinGet مع المصدر والتوقيع والتبعيات، ثم Progress حقيقي.",
 "Inspect installed package | Query updates | Review package source/signature | Approve supported update | Verify new version",
 "في اختبار fixture اثبت خروج installer وpackage version؛ تعامل مع exit code 3010/reboot."),
"app-store-packages":("معرض حزم مع بيانات المستودع الرسمية وحالات البحث والتوافق، يميز Install عن Preview عن Unsupported.",
 "Select approved repository | Inspect package manifest | Review install scope | Approve signed package | Verify installed inventory",
 "لا تنزيلات تلقائية ولا تثبيت غير مصرح، وافحص مصادر winget قبل الثقة."),
"startup-disable":("Bootline يوضح رسم قبل/بعد لتعطيل إدخال واحد وتأثيره على عملية تسجيل الدخول، مع حالة Protect/Unknown.",
 "Select exact autorun key | Inspect source and protections | Preview enable/disable delta | Approve change in VM | Re-read effective state",
 "سجل القيمة الأصلية لاستعادة محددة؛ لا تعديل Startup حقيقي على جهاز المستخدم."),
"startup-undo-all":("خط زمني مع اختيار تغييرات قديمة وإظهار إن كانت القيم الأصلية ما تزال قابلة للاستعادة بأمان.",
 "Choose journal batch | Check protected entries | Preview exact reverse state | Approve selective restore | Verify every OS source",
 "تعارض أو فقد صلاحية يخرج بنتيجة جزئية بدلا من إكمال كاذب."),
"services-control":("Orbit حقيقي يُظهر شبكة SCM والتبعيات المتأثرة بمسارات متوهجة، ومرحلة Preflight تحذر إذا كان هناك إيقاف خدمات تابعة.",
 "Select service name | Evaluate dependents and protected status | Preview exact SCM verb | Approve mock action | Verify actual state",
 "لا توقف Core service تلقائيا؛ Mock SCM/VM فقط وبصمة الحالة قبل وبعد."),
"services-config":("لوحة مقارنة StartType القديم بالجديد مع dependency tree وانطباع التغييرات عند الإقلاع القادم.",
 "Inspect SCM config | Choose allowed start type | Review dependencies | Approve authorized change | Verify Get-Service startup config",
 "استعادة السياسة السابقة مع تحقق idempotent وعدم فقد حالات الخدمات."),
"repair-winsock-reset":("Console تشخيص شبكة: لقطات Winsock Catalog وConnectivity قبل التطبيق، قائمة أثر انقطاع الشبكة واحتمال الحاجة لإعادة التشغيل، ثم transcript حقيقي.",
 "Inspect Winsock baseline | Explain connectivity risk | Preview fixed reset command | Confirm elevated VM run | Check reboot requirement + connectivity",
 "لا يوجد Undo وهمي؛ اختبر على VM فقط وأظهر أن إعادة بناء الكتالوج ليست عكسًا مضمونًا."),
"repair-tcpip-reset":("خريطة Diff لواجهات TCP/IP وDNS/routes قبل/بعد مع تنبيه واضح عن فقد اتصال VPN والسياسات.",
 "Snapshot current IP stack | Select supported reset | Show exact config diff | Confirm VM-only reset | Verify effective network after reboot",
 "لا تعرض Resolved قبل reconnect/postcheck، ولا تخزن بيانات الشبكة الحساسة دون تقليل."),
"repair-component-restore":("Guided DISM Playbook: مكون Windows يمر Check → Scan → Restore → Verify، Console سجل حي وحالة مصدر الصيانة/الإعادة.",
 "Run health diagnosis | Inspect repair source | Preview fixed DISM args | Approve elevated VM operation | Verify postcondition and reboot",
 "إيصال DISM/Exit Code ودليل صحة بعد العملية؛ ممنوع تشغيل DISM الحقيقي على جهاز المستخدم من تلقاء نفسه."),
"repair-files-repair":("خريطة File Integrity Shield تميز الملفات السليمة والمتضررة والمُصححة وفق mappable SFC transcript؛ لا تعدّاد ملفّق.",
 "Run VerifyOnly | Inspect signature/failure scope | Review exact SFC action | Confirm elevated VM scan | Parse CBS/SFC outcome",
 "SFC ScanNow فعلي ببيئة اختبار معتمدة فقط؛ reboot/fail/cannot repair حالات منفصلة."),
"network-repair-link":("Flow يربط Connectivity Diagnostics بعرض Recovery Preview للمشكل المحدد، ولا يغيّر DNS/Hosts/Network دون موافقة.",
 "Choose failed diagnostic | Inspect evidence | Compare safe recovery options | Confirm narrow VM repair | Retest connection",
 "طبّق أقل تغيير ممكن عبر runner ثابت، ولا تختصر كل الشبكة بزر RESET ALL."),
"storage-reclaim":("Basket بمرشحات قابلة للتفكيك: estimated savings مقابل verified reclaimed bytes، keeper للمكررات وإحالة لخزنة Cleanup.",
 "Scan authorized volume | Select reclaim candidates | Simulate safe destination | Approve owning Cleanup executor | Compare actual free space",
 "قياس قبل/بعد مع مراقبة تغيّر free bytes وعوامل cache؛ لا ضمان توفير رقم معين."),
"storage-duplicates":("متاهة مجموعات مكررات حقيقية تنشأ بعد تثبيت same-content hash، مع Keeper واحد إلزامي لكل مجموعة.",
 "Select scan scope | Group by size | Verify SHA-256 on candidates | Mark protected keepers | Preview safe quarantine",
 "Collision وsymlink والملف الجاري الكتابة عليه يمنع حذف أي مكرر."),
"auto-schedule-manager":("تقويم حي Next/Last Run، يظهر Clock ومنطقة زمنية وإشارات بطارية وQuiet Hours، وWorkflow runnable من سجل دائم.",
 "Select workflow | Compose schedule | Simulate trigger calendar | Approve schedule persistence | Pause / inspect actual runs",
 "Virtual Clock, DST, app-restart, missed-job recovery, no unapproved destructive jobs."),
"auto-cleanup-plan":("DAG بأربع مراحل Select→Review→Quarantine→Verify، توقّف إجباري للموافقة قبل أي حدث تنظيف حقيقي.",
 "Configure safe roots | Dry-run selected candidates | Configure approval threshold | Schedule protected run | Inspect vault journal",
 "أعد إبطال plans القديمة، ولا تأتمت حذف Windows دون إذن صريح لكل سياق."),
"mission-14-02":("Secure Provider Control Desk: تبديل النموذج/الحدود والـusage قبل أي اتصال، ومخزن أسرار Windows Main فقط.",
 "Open credential vault | Add key securely | Test authorized connection | Set network/spend limits | Revoke key",
 "لا تخزين المفتاح في React/localStorage، ولا وصول API بلا موافقة."),
"mission-14-08":("Assistant Trace Deck: كل اقتراح AI يظهر مصدره وخطوات أدواته، وتُرفض أوامر التأثير حتى يوافق المستخدم على نطاقها.",
 "Ask assistant | Inspect planned tools | Choose allowed capability | Approve each side effect | Review tool result",
 "افصل نص المستخدم عن صلاحيات API Native؛ لا generic command execution أو مسح ملفات من رسالة Chat."),
"mission-04-01":("Google Sheets Live Sheet Canvas: حساب مخول، Spreadsheet ID، Range، وصفوف مرتبطة بالأذونات والحصص.",
 "Connect with PKCE | Select sheet+range | Refresh read proof | Draft bounded write with scope consent | Confirm official Sheets API",
 "لا تدعِ الكتابة من Scope read-only؛ يجب وجود نطاق كتابة منفصل وبموافقة جديدة."),
"mission-01-09":("Instant command palette موحّد يفهرس أسماء الملفات والتطبيقات والخدمات بعد موافقة المصدر، ويفتح Workbench مباشرة.",
 "Authorize data sources | Update index | Search files/apps/tools | Choose target | Open contextual workbench",
 "اختبر 100k+ fixture ومدد فهرسة مع إلغاء وميزات وصول."),
}
updated=[]
for sid,(scene,buttons,proof) in SPECIAL.items():
 matches=list((ROOT/"services").rglob(sid+".md"))
 assert len(matches)==1,(sid,len(matches))
 p=matches[0];t=p.read_text(encoding="utf-8")
 t=t.replace("أزرار العمل الخمسة المطلوبة لهذه الخدمة","أزرار العمل المطلوبة لهذه الخدمة")
 # Keep previous design, append highly concrete implementation note and must-pass tests.
 t+="\n## سيناريو تنفيذ مُتخصص — إلزامي (Owner quality bar)\n"
 t+="**Live scene:** "+scene+"\n\n**Exact interaction flow:**\n"
 for n,a in enumerate(buttons.split(" | "),1):t+=str(n)+". "+a+"\n"
 t+="\n**Evidence & negative tests:** "+proof+"\n"
 t+="\n**Non-negotiable:** هذه الشاشة لا تكتمل برسمة؛ يلزم مزود فعلي + state transitions صادقة + اختبارات fixtures + إيصال عملية أو قياس حقيقي.\n"
 p.write_text(t,encoding="utf-8");updated.append(sid)
# normalize misleading "five buttons" heading for 181 docs including non-effect A
for p in (ROOT/"services").rglob("*.md"):
 s=p.read_text(encoding="utf-8")
 s=s.replace("أزرار العمل الخمسة المطلوبة لهذه الخدمة","أزرار العمل الموصولة المطلوبة لهذه الخدمة")
 p.write_text(s,encoding="utf-8")
print("SPECIALIZED="+str(len(updated)))
print("SERVICE_DOCS="+str(len(list((ROOT/"services").rglob("*.md")))))
