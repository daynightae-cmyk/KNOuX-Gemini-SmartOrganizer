# Automation Studio — LIVE DOMAIN PLAYBOOK

## مشهد هذا القسم
**Workflow Flight Deck**: محرر DAG مرئي يُظهِر Trigger→Queue→Worker→Receipt مع عرض Next Run حقيقي
**التفاعل:** العقد المتصلة تتحرك عند تلقي trigger أو worker event فقط
**القرارات:** جذر كل مشغل وحالات Retry وFailure وQuiet Hours
**سلسلة الأوامر الأصلية:** Compose workflow; validate; simulate; schedule; approve; pause/resume; inspect journal

## بناء الشاشات والمقياس
أبقِ مراجع DAY/NIGHT الأصلية وطبيعة القسم؛ أزرار العجلة وWorkbench تفتح كل خدمة بوسائلها الخاصة. الأحداث من Native/IPC فقط. لا تتجاوز نافذة التطبيق؛ القوائم تتدحرج داخليًا. كل إجراء يطلب تصريحًا عند أثره. Browser preview لا يعد إثبات Electron.

## الخدمات الفردية الرسمية (12)
- [Smart Scan Automated Workflow Flow](../../services/13_AUTOMATION/auto-smart-scan.md) — auto-smart-scan | B | AUDIT_REQUIRED
- [Weekly Automation Calendar & Task Manager](../../services/13_AUTOMATION/auto-schedule-manager.md) — auto-schedule-manager | B | AUDIT_REQUIRED
- [Automation Run History Timeline](../../services/13_AUTOMATION/auto-run-history.md) — auto-run-history | A | AUDIT_REQUIRED
- [Workflow Template Gallery & Library](../../services/13_AUTOMATION/auto-templates.md) — auto-templates | A | AUDIT_REQUIRED
- [Recurrence Composer & Cron Preview](../../services/13_AUTOMATION/auto-schedule-plan.md) — auto-schedule-plan | B | AUDIT_REQUIRED
- [Safe Automated Cleanup Pipeline](../../services/13_AUTOMATION/auto-cleanup-plan.md) — auto-cleanup-plan | C | AUDIT_REQUIRED
- [Notification Channel Routing Board](../../services/13_AUTOMATION/auto-notify.md) — auto-notify | B | AUDIT_REQUIRED
- [Quiet Hours 24-Hour Dial](../../services/13_AUTOMATION/auto-quiet-hours.md) — auto-quiet-hours | B | AUDIT_REQUIRED
- [Power-Aware Scheduler & Battery Gating](../../services/13_AUTOMATION/auto-battery-policy.md) — auto-battery-policy | B | AUDIT_REQUIRED
- [Artifact Retention Policy Timeline](../../services/13_AUTOMATION/auto-retention.md) — auto-retention | B | AUDIT_REQUIRED
- [Workflow Export & Schema Transfer](../../services/13_AUTOMATION/auto-export.md) — auto-export | B | AUDIT_REQUIRED
- [Backup Flow & Verification Designer](../../services/13_AUTOMATION/auto-backup-plan.md) — auto-backup-plan | B | AUDIT_REQUIRED

## حالات القبول
يجب فحص كل ID بواقعة source→operation→result وPreview وCTA مستقل؛ لا مبرر لتسميتها DONE بمجرد تصويرها. كل خاصية class A مفيدة من خلال query/monitor/compare/export/handoff، وClass B/C/D تكمل التنفيذ بموافقة وضمانات.
