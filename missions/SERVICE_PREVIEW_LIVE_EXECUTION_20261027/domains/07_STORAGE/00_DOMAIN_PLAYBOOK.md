# Storage Atlas — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Capacity Topographic Map**: خريطة Treemap تتوسع مع قياس أحجام المجلدات الفعلية، مع تمييز المساحة الفارغة والقابلة للاسترداد
**التفاعل:** موجة تعبئة القطاعات فقط حسب عينات التحليل الفعلية
**القرارات:** بايتات مثبتة، بيانات قرص حقيقية، غير معروف لا يعرض 0
**سلسلة الأوامر الأصلية:** Select volume; analyze; inspect heavy groups; stage reclaim; approve in Cleanup

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [Volume Bays & Partition Manager](../../services/07_STORAGE/storage-disks.md) — storage-disks | A | AUDIT_REQUIRED
- [Heavy-File Storage Ledger](../../services/07_STORAGE/storage-large-files.md) — storage-large-files | A | AUDIT_REQUIRED
- [Byte-Exact Duplicate Hash Groups](../../services/07_STORAGE/storage-duplicates.md) — storage-duplicates | B | AUDIT_REQUIRED
- [Interactive Storage Space Treemap](../../services/07_STORAGE/storage-treemap.md) — storage-treemap | A | AUDIT_REQUIRED
- [Folder Ranking Waterfall](../../services/07_STORAGE/storage-top-folders.md) — storage-top-folders | A | AUDIT_REQUIRED
- [Storage Byte Distribution by Category](../../services/07_STORAGE/storage-filetypes.md) — storage-filetypes | A | AUDIT_REQUIRED
- [Drive Coverage & Scan Dashboard](../../services/07_STORAGE/storage-scan-overview.md) — storage-scan-overview | A | AUDIT_REQUIRED
- [Drive Optimization & TRIM Dossier](../../services/07_STORAGE/storage-fragmentation.md) — storage-fragmentation | C | AUDIT_REQUIRED
- [Disk Reliability & S.M.A.R.T. Health](../../services/07_STORAGE/storage-smart.md) — storage-smart | A | AUDIT_REQUIRED
- [Storage Reclaim Planner & Basket](../../services/07_STORAGE/storage-reclaim.md) — storage-reclaim | C | AUDIT_REQUIRED
- [Capacity Trend Timeline](../../services/07_STORAGE/storage-history.md) — storage-history | A | AUDIT_REQUIRED
- [Removable USB & External Volume Dock](../../services/07_STORAGE/storage-removable.md) — storage-removable | A | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
