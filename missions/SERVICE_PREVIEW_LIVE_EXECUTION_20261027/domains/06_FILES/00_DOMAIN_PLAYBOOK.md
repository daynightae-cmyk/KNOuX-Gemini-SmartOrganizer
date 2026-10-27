# Files / Instant Search — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**File Intelligence Chamber**: فهرس بحث فوري بجداول نتائج قابلة للاختيار ومفتش الملف ومعاينة المصدر والهدف
**التفاعل:** الصفوف والمصغرات تظهر مع دفعات الفهرس، ولا يحجب glow أسماء الملفات
**القرارات:** التجزئة وحجم الملف والمسارات ومخرجات التنفيذ
**سلسلة الأوامر الأصلية:** Choose source; search; inspect; preview rename/move; approve; undo

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [Downloads Folder Inventory](../../services/06_FILES/file-downloads-inventory.md) — file-downloads-inventory | A | AUDIT_REQUIRED
- [Visual Rule Builder & Organization Studio](../../services/06_FILES/file-organize-preview.md) — file-organize-preview | B | AUDIT_REQUIRED
- [Organization Staging & Change Review](../../services/06_FILES/file-organize-apply.md) — file-organize-apply | B | AUDIT_REQUIRED
- [File Organization Undo Timeline](../../services/06_FILES/file-organize-undo.md) — file-organize-undo | B | AUDIT_REQUIRED
- [Sparse Empty Folder Explorer](../../services/06_FILES/file-empty-folders.md) — file-empty-folders | A | AUDIT_REQUIRED
- [Cryptographic Hash Inspector](../../services/06_FILES/file-hash.md) — file-hash | A | AUDIT_REQUIRED
- [Instant Everything-Style File Search](../../services/06_FILES/file-search.md) — file-search | A | AUDIT_REQUIRED
- [File Format Type Distribution](../../services/06_FILES/file-type-map.md) — file-type-map | A | AUDIT_REQUIRED
- [Recent File Timeline Histogram](../../services/06_FILES/file-recents.md) — file-recents | A | AUDIT_REQUIRED
- [Ranked Large File Explorer](../../services/06_FILES/file-largest.md) — file-largest | A | AUDIT_REQUIRED
- [Deep File Metadata & Attributes Dossier](../../services/06_FILES/file-metadata.md) — file-metadata | A | AUDIT_REQUIRED
- [Trust Evidence & Provenance Board](../../services/06_FILES/file-provenance.md) — file-provenance | A | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
