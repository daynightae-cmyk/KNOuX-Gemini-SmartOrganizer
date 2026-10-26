/**
 * Recovery Lab - servicing and file integrity workbenches (tools 01-05).
 * Every panel is bound to measured evidence. Administrative diagnostics are
 * previews only; no DISM or SFC process is started here.
 */
import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileCheck2,
  FileWarning,
  HardDrive,
  ListChecks,
  Lock,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Wrench,
} from 'lucide-react';
import type { RepairToolId } from '../../shared/native-contracts';
import type { RepairWorkbenchProps } from './ui';
import {
  CommandPreview,
  GuidedSequence,
  PlanDock,
  SafetyNote,
  RepairToolFrame,
  EvidenceRows,
  PrerequisiteList,
} from './ui';
import { fileEvidenceLabel, planForTool, t } from './model';
import { Chip, DataRows, Panel, Seg } from '../system/ui';

const AR = 'ar';

function useToolPlan({ controller, toolId }: RepairWorkbenchProps) {
  return planForTool(controller.plan, toolId);
}

/* 01 - DISM CheckHealth */
export function ComponentCheckWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const [view, setView] = useState<'checklist' | 'transcript'>('checklist');
  const planItem = useToolPlan(props);
  const steps = [
    { en: 'Read servicing log metadata', ar: 'قراءة بيانات سجل الخدمة', done: snapshot.servicing.dismLog.exists === true },
    { en: 'Confirm DISM availability', ar: 'تأكيد توفر DISM', done: snapshot.identity.dismAvailable === true },
    { en: 'Check component store health', ar: 'فحص صحة مخزن المكونات', done: false },
    { en: 'Report corruption without repair', ar: 'الإبلاغ عن التلف دون إصلاح', done: false },
  ];
  return (
    <RepairToolFrame
      {...props}
      provider="DISM.exe /Online /Cleanup-Image /CheckHealth"
      foot={
        <>
          <span><HardDrive aria-hidden="true" />{t(locale, 'Component store', 'مخزن المكونات')}: {snapshot.servicing.componentStore.exists ? t(locale, 'present', 'موجود') : t(locale, 'not found', 'غير موجود')}</span>
          <span><Lock aria-hidden="true" />{t(locale, 'Health check not executed', 'لم يُنفذ فحص الصحة')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Seg<'checklist' | 'transcript'>
          value={view}
          onChange={setView}
          ariaLabel={t(locale, 'Diagnostic view', 'عرض التشخيص')}
          compact
          options={[
            { value: 'checklist', label: t(locale, 'Checklist', 'قائمة الفحص') },
            { value: 'transcript', label: t(locale, 'Transcript', 'النص') },
          ]}
        />
        <span className="sys-toolbar-spacer" />
        <Chip tone={snapshot.identity.dismAvailable ? 'good' : 'bad'}>{snapshot.identity.dismAvailable ? t(locale, 'DISM found', 'DISM متوفر') : t(locale, 'DISM missing', 'DISM مفقود')}</Chip>
        <Chip tone={snapshot.identity.isAdmin ? 'warn' : 'muted'}>{snapshot.identity.isAdmin ? t(locale, 'Elevated', 'مرفوع الصلاحيات') : t(locale, 'Not elevated', 'غير مرفوع')}</Chip>
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'CheckHealth checklist', 'قائمة فحص الصحة')} sub={t(locale, 'Measured steps, not a simulated terminal.', 'خطوات مقيسة، ليست طرفية محاكاة.')} icon={ListChecks}>
          <ol className="rep-check-list">
            {steps.map((step, index) => (
              <li key={step.en} className={step.done ? 'is-done' : 'is-pending'}>
                <span className="rep-check-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{locale === AR ? step.ar : step.en}</strong>
                  <em>{step.done ? t(locale, 'Measured evidence available', 'دليل مقيس متاح') : t(locale, 'Not executed — elevated execution is gated', 'لم يُنفذ — التنفيذ المرفوع محجوب')}</em>
                </div>
                {step.done ? <CheckCircle2 aria-hidden="true" /> : <Lock aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title={view === 'checklist' ? t(locale, 'Component store evidence', 'أدلة مخزن المكونات') : t(locale, 'Diagnostic transcript', 'نص التشخيص')} icon={HardDrive}>
          {view === 'checklist' ? (
            <DataRows
              rows={[
                { label: t(locale, 'DISM log', 'سجل DISM'), value: fileEvidenceLabel(snapshot.servicing.dismLog, locale), mono: true },
                { label: t(locale, 'CBS log', 'سجل CBS'), value: fileEvidenceLabel(snapshot.servicing.cbsLog, locale), mono: true },
                { label: t(locale, 'Component store', 'مخزن المكونات'), value: snapshot.servicing.componentStore.exists ? t(locale, 'Present', 'موجود') : t(locale, 'Not found', 'غير موجود'), tone: snapshot.servicing.componentStore.exists ? 'good' : 'bad' },
                { label: t(locale, 'Pending CBS reboot', 'إعادة تشغيل CBS معلقة'), value: snapshot.servicing.pendingCbs == null ? '—' : snapshot.servicing.pendingCbs ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: snapshot.servicing.pendingCbs ? 'warn' : 'muted' },
                { label: t(locale, 'Store health', 'صحة المخزن'), value: t(locale, 'Not measured', 'غير مقيسة'), tone: 'warn' },
              ]}
            />
          ) : (
            <pre className="rep-transcript">{[
              `> DISM CheckHealth (preview)`,
              `> ${t(locale, 'execution', 'التنفيذ')}: ${t(locale, 'not available', 'غير متاح')}`,
              '',
              `[measured] dism.log ${snapshot.servicing.dismLog.exists ? 'present' : 'missing'}`,
              `[measured] CBS.log  ${snapshot.servicing.cbsLog.exists ? 'present' : 'missing'}`,
              `[pending]  Windows component store health`,
              '',
              t(locale, 'No command was executed. No transcript can be produced.', 'لم يُنفذ أي أمر. لا يمكن إنتاج نص.'),
            ].join('\n')}</pre>
          )}
        </Panel>
      </div>

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <GuidedSequence locale={locale} />
      <div className="sys-split-2">
        <Panel title={t(locale, 'Measured prerequisites', 'المتطلبات المقيسة')} icon={ShieldCheck}>
          <PrerequisiteList locale={locale} item={planItem} />
        </Panel>
        <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
      </div>
    </RepairToolFrame>
  );
}

/* 02 - DISM ScanHealth (seven stages) */
const SCAN_STAGES = [
  { en: 'Initializing DISM', ar: 'تهيئة DISM' },
  { en: 'Scanning component store', ar: 'مسح مخزن المكونات' },
  { en: 'Analyzing servicing metadata', ar: 'تحليل بيانات الخدمة' },
  { en: 'Detecting corruption', ar: 'كشف التلف' },
  { en: 'Classifying repairability', ar: 'تصنيف قابلية الإصلاح' },
  { en: 'Finalizing results', ar: 'إنهاء النتائج' },
  { en: 'Publishing a diagnostic verdict', ar: 'نشر حكم التشخيص' },
];

export function ComponentScanWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const [selected, setSelected] = useState(0);
  const [details, setDetails] = useState(false);
  const planItem = useToolPlan(props);
  const stage = SCAN_STAGES[selected];
  return (
    <RepairToolFrame
      {...props}
      provider="DISM.exe /Online /Cleanup-Image /ScanHealth"
      foot={
        <>
          <span><ScanLine aria-hidden="true" />{t(locale, 'Planned stages', 'مراحل مخططة')}: {SCAN_STAGES.length}</span>
          <span><Lock aria-hidden="true" />{t(locale, 'Scan not executed', 'لم يُنفذ المسح')}</span>
        </>
      }
    >
      <div className="sys-toolbar-row">
        <Chip tone="warn">{t(locale, '7-stage plan', 'خطة 7 مراحل')}</Chip>
        <Chip tone={snapshot.servicing.dismLog.exists ? 'good' : 'muted'}>{t(locale, 'DISM log measured', 'سجل DISM مقيس')}</Chip>
        <span className="sys-toolbar-spacer" />
        <button type="button" className={details ? 'sys-btn sys-btn-quiet is-active' : 'sys-btn sys-btn-quiet'} aria-pressed={details} onClick={() => setDetails((value) => !value)}>
          <Terminal aria-hidden="true" />{details ? t(locale, 'Hide technical notes', 'إخفاء الملاحظات') : t(locale, 'Technical notes', 'ملاحظات فنية')}
        </button>
      </div>

      <Panel title={t(locale, 'Seven-stage scan sequence', 'تسلسل المسح على سبع مراحل')} sub={t(locale, 'A plan derived from the fixed command. No progress is simulated.', 'خطة مشتقة من الأمر الثابت. لا يُحاكى أي تقدم.')} icon={ScanLine}>
        <ol className="rep-scan-stages">
          {SCAN_STAGES.map((entry, index) => (
            <li key={entry.en}>
              <button
                type="button"
                className={index === selected ? 'rep-scan-stage is-active' : 'rep-scan-stage'}
                onClick={() => setSelected(index)}
                aria-pressed={index === selected}
              >
                <span className="rep-scan-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="rep-scan-copy">
                  <strong>{locale === AR ? entry.ar : entry.en}</strong>
                  <em>{t(locale, 'not started — execution gated', 'لم يبدأ — التنفيذ محجوب')}</em>
                </span>
                <Lock aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Selected stage', 'المرحلة المحددة')} sub={`${selected + 1} / ${SCAN_STAGES.length}`} icon={ListChecks}>
          <DataRows
            rows={[
              { label: t(locale, 'Stage', 'المرحلة'), value: locale === AR ? stage.ar : stage.en },
              { label: t(locale, 'Status', 'الحالة'), value: t(locale, 'Planned only', 'مخطط فقط'), tone: 'warn' },
              { label: t(locale, 'Expected effect', 'الأثر المتوقع'), value: t(locale, 'Read-only analysis; no component is replaced.', 'تحليل للقراءة فقط؛ لا يُستبدل أي مكون.') },
              { label: t(locale, 'Elevation', 'رفع الصلاحيات'), value: t(locale, 'Required before any real scan.', 'مطلوب قبل أي مسح حقيقي.'), tone: 'warn' },
            ]}
          />
        </Panel>
        <Panel title={t(locale, 'Component store integrity', 'سلامة مخزن المكونات')} icon={ShieldAlert}>
          <DataRows
            rows={[
              { label: t(locale, 'Measured verdict', 'الحكم المقيس'), value: t(locale, 'Not measured — scan did not run', 'غير مقيس — لم يُشغّل المسح'), tone: 'warn' },
              { label: t(locale, 'Repairable corruption', 'تلف قابل للإصلاح'), value: t(locale, 'Unknown', 'مجهول'), tone: 'muted' },
              { label: t(locale, 'DISM log', 'سجل DISM'), value: fileEvidenceLabel(snapshot.servicing.dismLog, locale), mono: true },
              { label: t(locale, 'CBS log', 'سجل CBS'), value: fileEvidenceLabel(snapshot.servicing.cbsLog, locale), mono: true },
            ]}
          />
          {details ? (
            <p className="rep-technical-note">
              {t(locale, 'The scan would exercise the component store and may contact Windows Update only if a later RestoreHealth plan chooses that source. No network request is made by this preview.', 'سيختبر المسح مخزن المكونات وقد يتصل بـ Windows Update فقط إذا اختارت خطة استعادة لاحقة ذلك المصدر. لا تُجرى أي طلب شبكة في هذه المعاينة.')}
            </p>
          ) : null}
        </Panel>
      </div>

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
      <SafetyNote locale={locale} />
    </RepairToolFrame>
  );
}

/* 03 - DISM RestoreHealth */
export function ComponentRestoreWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const [source, setSource] = useState<'windows-update' | 'wim'>('windows-update');
  const planItem = useToolPlan(props);
  return (
    <RepairToolFrame
      {...props}
      provider="DISM.exe /Online /Cleanup-Image /RestoreHealth"
      foot={<><span><Wrench aria-hidden="true" />{t(locale, 'Repair plan', 'خطة إصلاح')}: {t(locale, 'preview only', 'معاينة فقط')}</span><span><Lock aria-hidden="true" />{t(locale, 'No servicing command executed', 'لم يُنفذ أمر خدمة')}</span></>}
    >
      <div className="rep-before-after">
        <Panel title={t(locale, 'Component health — before', 'صحة المكونات — قبل')} icon={ShieldAlert}>
          <div className="rep-health-card is-unknown">
            <span>{t(locale, 'Before restoration', 'قبل الاستعادة')}</span>
            <strong>{t(locale, 'Not measured', 'غير مقيسة')}</strong>
            <em>{t(locale, 'DISM CheckHealth was not executed.', 'لم يُنفذ فحص CheckHealth.')}</em>
          </div>
        </Panel>
        <Panel title={t(locale, 'Component health — after', 'صحة المكونات — بعد')} icon={ShieldCheck}>
          <div className="rep-health-card is-blocked">
            <span>{t(locale, 'After a future repair', 'بعد إصلاح مستقبلي')}</span>
            <strong>{t(locale, 'No result', 'لا نتيجة')}</strong>
            <em>{t(locale, 'Execution is gated; no after-state can be claimed.', 'التنفيذ محجوب؛ لا يمكن ادعاء حالة بعد.')}</em>
          </div>
        </Panel>
      </div>

      <div className="sys-split-2">
        <Panel title={t(locale, 'Repair source', 'مصدر الإصلاح')} sub={t(locale, 'Selection affects a future run only.', 'يؤثر الاختيار على تشغيل مستقبلي فقط.')} icon={HardDrive}>
          <Seg<'windows-update' | 'wim'>
            value={source}
            onChange={setSource}
            ariaLabel={t(locale, 'Repair source', 'مصدر الإصلاح')}
            options={[
              { value: 'windows-update', label: t(locale, 'Windows Update', 'Windows Update') },
              { value: 'wim', label: t(locale, 'WIM / install media', 'WIM / وسائط التثبيت') },
            ]}
          />
          <DataRows
            rows={[
              { label: t(locale, 'Selected source', 'المصدر المحدد'), value: source === 'windows-update' ? 'Windows Update' : 'WIM / install media' },
              { label: t(locale, 'Connectivity', 'الاتصال'), value: `${snapshot.network.adapters.length} ${t(locale, 'measured adapters', 'محول مقيس')}`, tone: snapshot.network.adapters.length ? 'good' : 'warn' },
              { label: t(locale, 'Source check', 'فحص المصدر'), value: t(locale, 'Not performed', 'لم يُجرَ'), tone: 'warn' },
              { label: t(locale, 'Pending reboot', 'إعادة التشغيل المعلقة'), value: snapshot.identity.pendingReboot ? t(locale, 'Yes', 'نعم') : t(locale, 'No', 'لا'), tone: snapshot.identity.pendingReboot ? 'warn' : 'muted' },
            ]}
          />
        </Panel>
        <Panel title={t(locale, 'Impact & prerequisites', 'الأثر والمتطلبات')} icon={ShieldAlert}>
          <EvidenceRows locale={locale} item={planItem} />
          <SafetyNote locale={locale} tone="bad">
            {t(locale, 'RestoreHealth can replace protected components and contact a servicing source. It requires elevation, explicit approval and verified postconditions. Those capabilities are not shipped here.', 'قد تستبدل RestoreHealth مكونات محمية وتتصل بمصدر خدمة. تتطلب رفع صلاحيات وموافقة صريحة وتحققًا من الشروط اللاحقة. هذه القدرات غير متوفرة هنا.')}
          </SafetyNote>
        </Panel>
      </div>

      <GuidedSequence locale={locale} />
      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
    </RepairToolFrame>
  );
}

/* 04 - SFC VerifyOnly */
export function FilesVerifyWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const [mode, setMode] = useState<'evidence' | 'output'>('evidence');
  const planItem = useToolPlan(props);
  return (
    <RepairToolFrame
      {...props}
      provider="sfc.exe /verifyonly"
      foot={<><span><FileCheck2 aria-hidden="true" />{t(locale, 'CBS log', 'سجل CBS')}: {snapshot.servicing.cbsLog.exists ? t(locale, 'measured', 'مقيس') : t(locale, 'not readable', 'غير مقروء')}</span><span><Lock aria-hidden="true" />{t(locale, 'SFC not executed', 'لم يُنفذ SFC')}</span></>}
    >
      <div className="rep-shield-hero">
        <div className="rep-shield" aria-hidden="true">
          <ShieldCheck />
          <span>{t(locale, 'VERIFY', 'تحقق')}</span>
        </div>
        <div className="rep-shield-copy">
          <span className="sys-wb-eyebrow">{t(locale, 'WINDOWS FILE INTEGRITY', 'سلامة ملفات WINDOWS')}</span>
          <strong>{t(locale, 'Protected system files are not verified yet.', 'لم يتم التحقق من ملفات النظام المحمية بعد.')}</strong>
          <p>{t(locale, 'VerifyOnly is read-only but requires elevation. Mission 11 publishes the fixed command, measured prerequisites and an immutable review plan; it does not run SFC.', 'VerifyOnly للقراءة فقط لكنه يتطلب رفع صلاحيات. تنشر المهمة 11 الأمر الثابت والمتطلبات المقيسة وخطة مراجعة ثابتة؛ ولا تشغل SFC.')}</p>
          <div className="rep-chip-row">
            <Chip tone={snapshot.identity.isAdmin ? 'warn' : 'muted'}>{snapshot.identity.isAdmin ? t(locale, 'Elevated session', 'جلسة مرفوعة') : t(locale, 'Standard session', 'جلسة عادية')}</Chip>
            <Chip tone={snapshot.identity.sfcAvailable ? 'good' : 'bad'}>{snapshot.identity.sfcAvailable ? 'sfc.exe' : t(locale, 'SFC missing', 'SFC مفقود')}</Chip>
            <Chip tone="bad" icon={Lock}>{t(locale, 'Not run', 'لم يُشغّل')}</Chip>
          </div>
        </div>
      </div>

      <div className="sys-toolbar-row">
        <Seg<'evidence' | 'output'>
          value={mode}
          onChange={setMode}
          ariaLabel={t(locale, 'Verification view', 'عرض التحقق')}
          compact
          options={[
            { value: 'evidence', label: t(locale, 'Evidence', 'الأدلة') },
            { value: 'output', label: t(locale, 'Sample output', 'عينة الإخراج') },
          ]}
        />
      </div>

      <div className="sys-split-2">
        <Panel title={mode === 'evidence' ? t(locale, 'Verification evidence', 'أدلة التحقق') : t(locale, 'Sample output (not executed)', 'عينة الإخراج (لم تُنفذ)')} icon={FileCheck2}>
          {mode === 'evidence' ? (
            <DataRows
              rows={[
                { label: t(locale, 'File integrity', 'سلامة الملفات'), value: t(locale, 'Not verified', 'لم يتم التحقق'), tone: 'warn' },
                { label: t(locale, 'CBS log path', 'مسار سجل CBS'), value: snapshot.servicing.cbsLog.path || '—', mono: true },
                { label: t(locale, 'CBS log size', 'حجم سجل CBS'), value: fileEvidenceLabel(snapshot.servicing.cbsLog, locale), mono: true },
                { label: t(locale, 'Protected binaries', 'الملفات المحمية'), value: t(locale, 'Not enumerated by a read-only provider', 'لا يُسردها مزود للقراءة فقط'), tone: 'muted' },
              ]}
            />
          ) : (
            <pre className="rep-transcript">{[
              '> sfc.exe /verifyonly   (preview only)',
              '',
              'Beginning verification phase of system scan.',
              'Verification 0% complete.',
              '...',
              t(locale, 'No command was executed. This is a labelled sample, not a reading.', 'لم يُنفذ أي أمر. هذه عينة موسومة وليست قراءة.'),
            ].join('\n')}</pre>
          )}
        </Panel>
        <Panel title={t(locale, 'Prerequisites & scope', 'المتطلبات والنطاق')} icon={ListChecks}>
          <PrerequisiteList locale={locale} item={planItem} />
          <DataRows
            rows={[
              { label: t(locale, 'Scope', 'النطاق'), value: t(locale, 'Protected Windows system files', 'ملفات نظام Windows المحمية') },
              { label: t(locale, 'Repair', 'الإصلاح'), value: t(locale, 'None in VerifyOnly', 'لا يوجد في VerifyOnly'), tone: 'good' },
              { label: t(locale, 'Reboot', 'إعادة التشغيل'), value: t(locale, 'Not expected', 'غير متوقعة'), tone: 'muted' },
            ]}
          />
        </Panel>
      </div>

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
    </RepairToolFrame>
  );
}

/* 05 - SFC ScanNow */
export function FilesRepairWorkbench(props: RepairWorkbenchProps) {
  const { locale, snapshot } = props;
  const planItem = useToolPlan(props);
  const steps = useMemo(() => [
    { en: 'Pre-scan evidence', ar: 'أدلة ما قبل الفحص', state: snapshot.servicing.cbsLog.exists ? 'measured' : 'unknown' },
    { en: 'Protected file scan', ar: 'فحص الملفات المحمية', state: 'not-run' },
    { en: 'Repair from component store', ar: 'الإصلاح من مخزن المكونات', state: 'not-run' },
    { en: 'Postcondition verification', ar: 'التحقق من الشرط اللاحق', state: 'not-run' },
  ], [snapshot.servicing.cbsLog.exists]);
  return (
    <RepairToolFrame
      {...props}
      provider="sfc.exe /scannow"
      foot={<><span><FileWarning aria-hidden="true" />{t(locale, 'Repair scope', 'نطاق الإصلاح')}: {t(locale, 'protected system files', 'ملفات النظام المحمية')}</span><span><Lock aria-hidden="true" />{t(locale, 'Execution gated', 'التنفيذ محجوب')}</span></>}
    >
      <div className="rep-before-after">
        <Panel title={t(locale, 'Restoration timeline (planned)', 'خط زمني للإصلاح (مخطط)')} icon={FileWarning}>
          <ol className="rep-check-list">
            {steps.map((step, index) => (
              <li key={step.en} className={step.state === 'measured' ? 'is-done' : 'is-pending'}>
                <span className="rep-check-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{locale === AR ? step.ar : step.en}</strong>
                  <em>{step.state === 'measured' ? t(locale, 'Measured evidence available', 'دليل مقيس متاح') : t(locale, 'Not executed', 'لم يُنفذ')}</em>
                </div>
                {step.state === 'measured' ? <CheckCircle2 aria-hidden="true" /> : <Lock aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title={t(locale, 'Risk & permission', 'الخطورة والإذن')} icon={ShieldAlert}>
          <DataRows
            rows={[
              { label: t(locale, 'Risk', 'الخطورة'), value: t(locale, 'Administrative', 'إداري'), tone: 'bad' },
              { label: t(locale, 'Elevation', 'رفع الصلاحيات'), value: snapshot.identity.isAdmin ? t(locale, 'Current session elevated', 'الجلسة الحالية مرفوعة') : t(locale, 'Required — not granted', 'مطلوب — غير ممنوح'), tone: 'warn' },
              { label: t(locale, 'Restart', 'إعادة التشغيل'), value: t(locale, 'Possible after repair', 'محتملة بعد الإصلاح'), tone: 'warn' },
              { label: t(locale, 'Protected scope', 'النطاق المحمي'), value: t(locale, 'Windows system binaries only', 'ثنائيات نظام Windows فقط') },
              { label: t(locale, 'Evidence', 'الأدلة'), value: t(locale, 'Measured CBS metadata; no repair result', 'بيانات CBS مقيسة؛ لا نتيجة إصلاح'), tone: 'muted' },
            ]}
          />
          <EvidenceRows locale={locale} item={planItem} />
        </Panel>
      </div>

      <CommandPreview locale={locale} snapshot={snapshot} toolId={props.toolId} />
      <GuidedSequence locale={locale} />
      <PlanDock locale={locale} controller={props.controller} toolId={props.toolId} />
      <SafetyNote locale={locale} tone="bad" />
    </RepairToolFrame>
  );
}
