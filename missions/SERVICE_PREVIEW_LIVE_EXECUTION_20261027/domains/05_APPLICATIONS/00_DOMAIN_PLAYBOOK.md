# Applications — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Software Dossier**: رف البرامج الحقيقية مع Publisher وSignature وVersion وحجم كل برنامج وخطة الإزالة/التحديث الدقيقة
**التفاعل:** بطاقة البرنامج تتحول إلى Verified Installed/Removed فقط بعد re-read فعلي
**القرارات:** توقيع الناشر ومصدر التثبيت وإجراءات الموافقة
**سلسلة الأوامر الأصلية:** Inventory; inspect; verify signature; plan install/uninstall; confirm; verify

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [Installed Applications Register](../../services/05_APPLICATIONS/app-inventory.md) — app-inventory | A | AUDIT_REQUIRED
- [App Identity & Authenticode Trust](../../services/05_APPLICATIONS/app-identity.md) — app-identity | A | AUDIT_REQUIRED
- [Multi-Parameter Software Search](../../services/05_APPLICATIONS/app-search.md) — app-search | A | AUDIT_REQUIRED
- [Publisher Intelligence & Reputation](../../services/05_APPLICATIONS/app-publisher.md) — app-publisher | A | AUDIT_REQUIRED
- [Recently Changed Applications](../../services/05_APPLICATIONS/app-recent.md) — app-recent | A | AUDIT_REQUIRED
- [Bulk Uninstall Queue & Batch Manager](../../services/05_APPLICATIONS/app-uninstall-queue.md) — app-uninstall-queue | C | AUDIT_REQUIRED
- [Orphaned Leftover Trace Analysis](../../services/05_APPLICATIONS/app-leftovers.md) — app-leftovers | C | AUDIT_REQUIRED
- [Software Update Center](../../services/05_APPLICATIONS/app-updates.md) — app-updates | C | AUDIT_REQUIRED
- [Software Storage Footprint Treemap](../../services/05_APPLICATIONS/app-size.md) — app-size | A | AUDIT_REQUIRED
- [Package Center & WinGet Browser](../../services/05_APPLICATIONS/app-store-packages.md) — app-store-packages | C | AUDIT_REQUIRED
- [File Extension & Protocol Matrix](../../services/05_APPLICATIONS/app-associations.md) — app-associations | C | AUDIT_REQUIRED
- [Software Boot Impact Analyzer](../../services/05_APPLICATIONS/app-startup-impact.md) — app-startup-impact | A | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
