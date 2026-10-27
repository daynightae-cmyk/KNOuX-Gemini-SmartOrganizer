# Repair Lab — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Guided Rescue Sequence**: تسلسل تشخيص وإصلاح متدرج بملخص الأمر المعتمد ومخرجات runner الحقيقية
**التفاعل:** خطوات الإصلاح تضيء عند وصول stdout/stderr أو status من التنفيذ المعتمد
**القرارات:** الدليل قبل/بعد، هل يلزم Reboot، وما لا يمكن التراجع عنه
**سلسلة الأوامر الأصلية:** Diagnose; prepare exact command plan; inspect impact; approve UAC; run; postcheck

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [DISM CheckHealth Diagnostic Console](../../services/11_REPAIR/repair-component-check.md) — repair-component-check | A | AUDIT_REQUIRED
- [DISM ScanHealth 7-Stage Console](../../services/11_REPAIR/repair-component-scan.md) — repair-component-scan | A | AUDIT_REQUIRED
- [DISM RestoreHealth System Repair Wizard](../../services/11_REPAIR/repair-component-restore.md) — repair-component-restore | C | AUDIT_REQUIRED
- [SFC VerifyOnly File Integrity Shield](../../services/11_REPAIR/repair-files-verify.md) — repair-files-verify | A | AUDIT_REQUIRED
- [SFC ScanNow Protected File Repair Wizard](../../services/11_REPAIR/repair-files-repair.md) — repair-files-repair | C | AUDIT_REQUIRED
- [DNS Resolver Cache Refresh Preview](../../services/11_REPAIR/repair-dns-flush.md) — repair-dns-flush | C | AUDIT_REQUIRED
- [Winsock Catalog Disruption Risk Review](../../services/11_REPAIR/repair-winsock-reset.md) — repair-winsock-reset | C | AUDIT_REQUIRED
- [TCP/IP Stack Reset Configuration Diff](../../services/11_REPAIR/repair-tcpip-reset.md) — repair-tcpip-reset | C | AUDIT_REQUIRED
- [System Repair Audit Journal](../../services/11_REPAIR/repair-history.md) — repair-history | A | AUDIT_REQUIRED
- [Windows Troubleshooter Gateway](../../services/11_REPAIR/repair-troubleshooters.md) — repair-troubleshooters | C | AUDIT_REQUIRED
- [System Restore Point Inspector](../../services/11_REPAIR/repair-restore-point.md) — repair-restore-point | C | AUDIT_REQUIRED
- [Windows Update Servicing Reset Wizard](../../services/11_REPAIR/repair-update-reset.md) — repair-update-reset | C | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
