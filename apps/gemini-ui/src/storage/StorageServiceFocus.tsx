import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Copy,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import type {
  StorageAnalysis,
  StorageCapacityPoint,
  StorageDuplicateResult,
  StorageVolume,
  StorageTreeNode,
} from '../../shared/native-contracts';
import { formatStorageBytes } from './useStorageNative';
import { StorageTabContent, type StorageTabKey } from './StorageTabContent';
import { StorageSpaceMap } from './StorageSpaceMap';

interface StorageServiceFocusProps {
  serviceKey: string;
  isArabic: boolean;
  volumes: StorageVolume[];
  analysis: StorageAnalysis | null;
  duplicates: StorageDuplicateResult | null;
  history: StorageCapacityPoint[];
  verifying: boolean;
  error: string | null;
  working: boolean;
  cancelable: boolean;
  onCancel: () => void;
  onClose: () => void;
  onChoose: () => void;
  onRescan: () => void;
  onRefreshVolumes: () => Promise<void> | void;
  onCopy: (label: string, text: string) => void;
  onTab: (tab: StorageTabKey) => void;
  onVerify: () => void;
  onNavigateFiles: () => void;
  onNavigateCleanup: () => void;
  onNavigateStudio: () => void;
  onOpenVault: () => void;
  embedded?: boolean;
}

export function storageServiceLabel(serviceKey: string, isArabic: boolean): { title: string; description: string } {
  const meta = LABELS[serviceKey] || { en: serviceKey, ar: serviceKey, descEn: '', descAr: '' };
  return { title: isArabic ? meta.ar : meta.en, description: isArabic ? meta.descAr : meta.descEn };
}

const LABELS: Record<string, { en: string; ar: string; descEn: string; descAr: string }> = {
  'storage-disks': { en: 'Volume Bays', ar: 'خليج وحدات التخزين', descEn: 'Measured mounted volumes and capacity.', descAr: 'وحدات التخزين المثبتة والسعة المقيسة.' },
  'storage-large-files': { en: 'Heavy-File Ledger', ar: 'سجل الملفات الثقيلة', descEn: 'Largest indexed files in the authorized scope.', descAr: 'أكبر الملفات المفهرسة في النطاق المصرح.' },
  'storage-duplicates': { en: 'Duplicate Hash Groups', ar: 'مجموعات التكرار', descEn: 'Size candidates and bounded byte-exact verification.', descAr: 'مرشحات الحجم وتحقق محتوى محدود.' },
  'storage-treemap': { en: 'Storage Treemap', ar: 'خريطة المساحة', descEn: 'Measured folder tree proportional to bytes.', descAr: 'شجرة مجلدات مقيسة تتناسب مع البايتات.' },
  'storage-top-folders': { en: 'Folder Ranking', ar: 'ترتيب المجلدات', descEn: 'Largest top-level folders in the scope.', descAr: 'أكبر المجلدات في النطاق.' },
  'storage-filetypes': { en: 'Type Distribution', ar: 'توزيع الأنواع', descEn: 'Measured extension counts and bytes.', descAr: 'الأعداد والبايتات حسب الامتداد.' },
  'storage-scan-overview': { en: 'Scan Coverage', ar: 'تغطية الفحص', descEn: 'What was actually indexed, and what was not.', descAr: 'ما تمت فهرسته فعليًا وما لم يتم.' },
  'storage-fragmentation': { en: 'Optimization & TRIM', ar: 'التحسين وTRIM', descEn: 'Provider capability dossier — no defrag/TRIM channel is exposed.', descAr: 'ملف قدرات المزود — لا تُعرض قناة إلغاء تجزئة أو TRIM.' },
  'storage-smart': { en: 'S.M.A.R.T. Health', ar: 'صحة S.M.A.R.T.', descEn: 'Support probe over the measured provider — health scores are never invented.', descAr: 'فحص دعم فوق المزود المقيس — لا تُختلق درجات صحة.' },
  'storage-reclaim': { en: 'Reclaim Planner', ar: 'مخطط الاستعادة', descEn: 'Measured candidates only; plans are reviewed in Cleanup or Studio.', descAr: 'مرشحات مقيسة فقط؛ تُراجع الخطط في التنظيف أو الاستوديو.' },
  'storage-history': { en: 'Capacity Trend', ar: 'اتجاه السعة', descEn: 'Snapshots captured while this app measured volumes.', descAr: 'لقطات مسجلة أثناء قياس التطبيق للأحجام.' },
  'storage-removable': { en: 'Removable Dock', ar: 'قاعدة الوسائط', descEn: 'Windows drive-type inventory and measured capacity. Refresh after connecting media.', descAr: 'نوع وحدات التخزين وسعتها المقيسة من Windows. حدّث بعد توصيل الوسائط.' },
};

function metricRow(label: string, value: string) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-slate-200 text-right">{value}</span>
    </div>
  );
}

function share(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

// A missing coverage count must degrade to an explicit dash, never crash the
// workbench tree or print an invented figure.
function measuredCount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '—';
}

const actionButton = 'px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer disabled:opacity-50';
const quietButton = 'px-2 py-1 rounded bg-[#0a1c38] border border-[#173766] text-slate-300 text-[10px] cursor-pointer disabled:opacity-50';

export function StorageServiceFocus({
  serviceKey,
  isArabic,
  volumes,
  analysis,
  duplicates,
  history,
  verifying,
  error,
  working, cancelable, onCancel,
  onClose,
  onChoose,
  onRescan,
  onRefreshVolumes,
  onCopy,
  onTab,
  onVerify,
  onNavigateFiles,
  onNavigateCleanup,
  onNavigateStudio,
  onOpenVault,
  embedded = false,
}: StorageServiceFocusProps) {
  const meta = LABELS[serviceKey] || { en: serviceKey, ar: serviceKey, descEn: '', descAr: '' };
  const measured = Boolean(analysis) || volumes.length > 0;
  const warnings = analysis?.coverage?.warnings ?? [];
  const [probe, setProbe] = useState<{ at: string } | null>(null);
  const [query, setQuery] = useState('');
  const [typeMeasure, setTypeMeasure] = useState<'count' | 'bytes'>('bytes');
  const [selectedNode, setSelectedNode] = useState<StorageTreeNode | null>(null);
  const [dockType, setDockType] = useState('2');
  useEffect(() => {setQuery('');setSelectedNode(null);}, [serviceKey, analysis?.sourceId, analysis?.coverage.lastScanned]);
  const smartCount = volumes.filter((volume) => volume.smartAvailable).length;
  const identityCount = volumes.filter((volume) => volume.physicalDeviceAvailable).length;

  const label = (en: string, ar: string) => (isArabic ? ar : en);
  // Re-reads the measured provider, then stamps the probe. Counts are derived
  // from the live props so the dossier can never print a stale figure.
  const probeNow = async () => {
    await onRefreshVolumes();
    setProbe({ at: new Date().toISOString() });
  };

  const measuredVolumesText = () => volumes
    .map((volume) => `${volume.letter} ${volume.label} | DriveType=${volume.driveType ?? 'unknown'} | ${volume.fileSystem} | ${formatStorageBytes(volume.usedBytes)} used / ${formatStorageBytes(volume.totalBytes)} | free ${formatStorageBytes(volume.freeBytes)}`)
    .join('\n');

  const renderBody = () => {
    switch (serviceKey) {
      case 'storage-disks':
        return (
          <div className="space-y-1.5">
            {volumes.length ? volumes.map((volume) => (
              <div key={volume.id} className="rounded border border-[#132c52] bg-[#08162b] p-1.5 space-y-1">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="font-mono text-white">{volume.letter} <span className="text-slate-400 font-sans">{volume.label}</span></span>
                  <span className="font-mono text-slate-300">{formatStorageBytes(volume.freeBytes)} free / {formatStorageBytes(volume.totalBytes)}</span>
                </div>
                <div className="h-1 rounded bg-[#0a1c38] overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${volume.usedPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>{volume.fileSystem} · {label('used', 'مستخدم')} {volume.usedPercent}%</span>
                  {volume.isLowSpace && <span className="text-amber-300">{label('low space', 'مساحة منخفضة')}</span>}
                </div>
              </div>
            )) : <div className="text-[10px] text-amber-300">{label('No measured volumes.', 'لا توجد أحجام مقيسة.')}</div>}
            <div className="text-[9px] text-slate-500">{label('Physical identity and SMART are not exposed by the current provider.', 'الهوية الفيزيائية وSMART غير متاحين من المزود الحالي.')}</div>
            <div className="flex gap-1.5">
              <button data-testid="storage-disks-choose" onClick={onChoose} className={actionButton}>{label('Authorize analysis scope', 'تحديد نطاق التحليل')}</button>
              <button data-testid="storage-disks-refresh" onClick={() => void onRefreshVolumes()} className={quietButton}><RefreshCw className="w-3 h-3 inline me-1" />{label('Refresh', 'تحديث')}</button>
            </div>
          </div>
        );
      case 'storage-large-files': {
        const largest = (analysis?.largest || []).filter(item => `${item.name} ${item.relative}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
        return <section className="knx-storage-tool">
          <label className="knx-file-filter-label">{label('Find in ranked files','البحث في الملفات المرتبة')}<input type="search" value={query} onChange={e => setQuery(e.target.value)}/></label>
          {analysis ? <><p>{label(`${largest.length} returned files · ${analysis.totals.files} files indexed in the authorized scope.`,`${largest.length} ملفًا معادًا · ${analysis.totals.files} ملفًا مفهرسًا في النطاق المصرح.`)}</p><StorageTabContent tab="large" analysis={analysis} isArabic={isArabic} searchQuery={query}/></> : <p>{label('Authorize and index a folder to measure its largest files.','صرح بمجلد وافهرسه لقياس أكبر ملفاته.')}</p>}
          <div className="knx-tool-actions"><button type="button" data-testid="storage-large-open-ledger" onClick={() => onTab('large')}>{label('Open ledger','فتح السجل')}</button><button type="button" data-testid="storage-large-copy" disabled={!largest.length} onClick={() => onCopy('Largest files',largest.map(item => `${item.size} B\t${item.relative}`).join('\n'))}>{label('Copy filtered list','نسخ القائمة المصفاة')}</button><button type="button" onClick={analysis ? onRescan : onChoose}>{analysis ? label('Rescan','إعادة فحص') : label('Choose folder','اختيار مجلد')}</button></div>
        </section>;
      }
      case 'storage-duplicates':
        return (
          <div className="space-y-2">
            {analysis ? (
              <>
                {metricRow(label('Size candidates', 'مرشحات الحجم'), (analysis.duplicateCandidates.length || 0).toString())}
                {metricRow(label('Potential wasted', 'بايتات مهدورة محتملة'), formatStorageBytes(analysis.duplicateCandidates.reduce((sum, group) => sum + group.wastedBytes, 0)))}
                <div className="text-[9px] text-amber-300">{label(`Size matches are not proof; only files ≥ ${formatStorageBytes(analysis.duplicatePolicy.minimumBytes)} are candidates and verification is bounded.`, `المطابقة بالحجم ليست دليلًا؛ المرشحات فقط للملفات ≥ ${formatStorageBytes(analysis.duplicatePolicy.minimumBytes)} والتحقق محدود.`)}</div>
                <button data-testid="storage-duplicates-verify" onClick={onVerify} disabled={verifying} className={actionButton}>
                  {verifying ? label('Verifying…', 'جارٍ التحقق…') : label('Verify content', 'تحقق من المحتوى')}
                </button>
                {duplicates && (
                  <div className="space-y-1">
                    {metricRow(label('Files hashed', 'ملفات تم تجزئتها'), `${duplicates.summary.filesHashed} · ${formatStorageBytes(duplicates.summary.bytesHashed)}`)}
                    {metricRow(label('Verified groups', 'مجموعات مؤكدة'), duplicates.summary.verifiedGroups.toString())}
                    {metricRow(label('Verified reclaimable', 'قابل للاستعادة مؤكدًا'), formatStorageBytes(duplicates.summary.reclaimableVerifiedBytes))}
                    {duplicates.groups.map((group) => (
                      <div key={group.digest} className="rounded border border-[#132c52] bg-[#08162b] p-1.5 text-[9px] font-mono space-y-0.5">
                        <div className="text-cyan-300 knx-tool-path">{group.digest}</div>
                        <div className="text-slate-400">{group.count} × {formatStorageBytes(group.size)} · {formatStorageBytes(group.wastedBytes)} {label('wasted', 'مهدور')}</div>
                        <details><summary>{label('Inspect matching paths','فحص المسارات المتطابقة')} ({group.files.length})</summary>{group.files.map(file => <p key={file.id} className="knx-tool-path">{file.relative} · {file.size.toLocaleString()} B</p>)}</details>
                      </div>
                    ))}
                    {duplicates.warnings.map((warning,index) => <p role="status" key={index}>{warning}</p>)}
                    {duplicates.errors.length ? <details className="knx-tool-evidence"><summary>{label('Native verification errors','أخطاء التحقق الأصلي')} ({duplicates.errors.length})</summary>{duplicates.errors.map((failure,index) => <p key={index}>{failure.name} · <code>{failure.code}</code> · {failure.message}</p>)}</details> : null}
                    {duplicates.summary.budgetReached && <div className="text-amber-300 text-[9px]">{label('Partial due to the bounded hashing budget.', 'النتيجة جزئية بسبب حد التجزئة.')}</div>}
                    {duplicates.errors.length > 0 && <div className="text-amber-300 text-[9px]">{label(`${duplicates.errors.length} file(s) were excluded because they changed or failed to hash.`, `استُبعد ${duplicates.errors.length} ملفًا لتغيّره أو فشل تجزئته.`)}</div>}
                    <button data-testid="storage-duplicates-open-vault" onClick={onOpenVault} className={quietButton}>{label('Review keepers in the Safety Vault', 'مراجعة النسخ المحتفظ بها في خزنة الأمان')}</button>
                  </div>
                )}
              </>
            ) : <div className="text-[10px] text-amber-300">{label('Index a scope for duplicate analysis.', 'افهرس نطاقًا لتحليل التكرار.')}</div>}
          </div>
        );
      case 'storage-treemap':
        return <section className="knx-storage-tool">
          <label className="knx-file-filter-label">{label('Find a measured folder','البحث عن مجلد مقيس')}<input type="search" value={query} onChange={e => setQuery(e.target.value)}/></label>
          {analysis ? <><StorageSpaceMap tree={analysis.tree} isArabic={isArabic} searchQuery={query} selectedId={selectedNode?.id || null} onSelect={setSelectedNode}/>
            {selectedNode ? <section className="knx-tool-evidence"><h3>{selectedNode.name}</h3><p className="knx-tool-path">{selectedNode.relative || analysis.coverage.scope}</p><dl className="knx-file-metadata-grid"><div><dt>{label('Measured size','الحجم المقيس')}</dt><dd dir="ltr">{formatStorageBytes(selectedNode.sizeBytes)}</dd></div><div><dt>{label('Files','الملفات')}</dt><dd>{selectedNode.files.toLocaleString()}</dd></div></dl></section> : null}
            <p>{label('Select a tile to inspect. Double-click or use Zoom in to navigate returned children. Folder scope only; no whole-volume claim.','اختر بلاطة للفحص. انقر مرتين أو استخدم التكبير للتنقل في العقد المكتشفة. النطاق مجلد فقط، وليس القرص بالكامل.')}</p>
            {analysis.coverage.partial ? <p role="status">{label('Partial coverage: some paths or nodes were not returned.','تغطية جزئية: لم تُعد بعض المسارات أو العقد.')}</p> : null}
          </> : <button type="button" onClick={onChoose} className={actionButton}>{label('Authorize folder for map','التصريح بمجلد للخريطة')}</button>}
          <button type="button" data-testid="storage-treemap-open" onClick={() => onTab('treemap')} className={quietButton}>{label('Open section map','فتح خريطة القسم')}</button>
        </section>;
      case 'storage-top-folders':
      case 'storage-filetypes': {
        const tab = serviceKey === 'storage-top-folders' ? 'folders' : 'types';
        return <section className="knx-storage-tool">
          <label className="knx-file-filter-label">{label('Filter measured rows','تصفية الصفوف المقيسة')}<input type="search" value={query} onChange={e => setQuery(e.target.value)}/></label>
          {tab === 'types' ? <div role="group" aria-label={label('Distribution measure','مقياس التوزيع')} className="knx-tool-actions">{(['count','bytes'] as const).map(measure => <button type="button" key={measure} aria-pressed={typeMeasure === measure} onClick={() => setTypeMeasure(measure)}>{measure === 'count' ? label('File count','عدد الملفات') : label('Bytes','الحجم')}</button>)}</div> : null}
          {analysis ? <StorageTabContent tab={tab} analysis={analysis} isArabic={isArabic} searchQuery={query} distributionMeasure={typeMeasure}/> : <p>{label('No folder analysis yet. Choose an authorized scope.','لا يوجد تحليل مجلد بعد. اختر نطاقًا مصرحًا.')}</p>}
          <div className="knx-tool-actions"><button type="button" data-testid={tab === 'folders' ? 'storage-folders-open' : 'storage-types-open'} onClick={() => onTab(tab)}>{label('Open section view','فتح عرض القسم')}</button><button type="button" onClick={analysis ? onRescan : onChoose}>{analysis ? label('Rescan','إعادة فحص') : label('Choose folder','اختيار مجلد')}</button></div>
        </section>;
      }
      case 'storage-scan-overview':
        return analysis ? (
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" />{analysis.coverage?.partial ? label('Partial coverage', 'تغطية جزئية') : label('Complete for the scope', 'تغطية مكتملة للنطاق')}</div>
            {metricRow(label('Files', 'الملفات'), measuredCount(analysis.coverage?.files))}
            {metricRow(label('Folders', 'المجلدات'), measuredCount(analysis.coverage?.folders))}
            {metricRow(label('Bytes analyzed', 'البايتات المحللة'), formatStorageBytes(analysis.totals?.analyzedBytes ?? 0))}
            {metricRow(label('Last scan', 'آخر فحص'), analysis.coverage?.lastScanned || '—')}
            {metricRow(label('Permission', 'الإذن'), analysis.permission)}
            <div className="text-slate-500 break-all">{analysis.coverage?.scope || label('Scope unavailable', 'النطاق غير متاح')}</div>
            {warnings.slice(0, 3).map((warning) => <div key={warning} className="text-amber-300/90">{warning}</div>)}
            <div className="flex gap-1.5">
              <button data-testid="storage-scan-rescan" onClick={onRescan} className={actionButton}>{label('Rescan scope', 'إعادة فحص النطاق')}</button>
              <button
                data-testid="storage-scan-copy"
                onClick={() => onCopy('Scan coverage', [
                  `coverage: ${analysis.coverage?.partial ? 'partial' : 'complete'}`,
                  `scope: ${analysis.coverage?.scope || 'unknown'}`,
                  `files: ${analysis.coverage?.files ?? 'unknown'}`,
                  `folders: ${analysis.coverage?.folders ?? 'unknown'}`,
                  `bytes: ${analysis.totals?.analyzedBytes ?? 'unknown'}`,
                  `lastScanned: ${analysis.coverage?.lastScanned || 'unknown'}`,
                  `permission: ${analysis.permission}`,
                  ...warnings.map((warning) => `warning: ${warning}`),
                ].join('\n'))}
                className={quietButton}
              ><ClipboardCopy className="w-3 h-3 inline me-1" />{label('Copy report', 'نسخ التقرير')}</button>
            </div>
          </div>
        ) : <div className="text-[10px] text-amber-300">{label('No indexed scope yet.', 'لا يوجد نطاق مفهرس بعد.')}</div>;
      case 'storage-fragmentation':
        return (
          <div className="space-y-2 text-[10px]">
            <div className="text-rose-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{label(
                'No defragmentation or TRIM operation is exposed in this build. The native allowlist only serves volumes, history, analysis and duplicate verification, so optimization cannot be measured or requested here.',
                'لا تُعرض أي عملية إلغاء تجزئة أو TRIM في هذا البناء. قائمة القنوات الأصلية تخدم الأحجام والسجل والتحليل وتحقق التكرار فقط، لذا لا يمكن قياس التحسين أو طلبه هنا.',
              )}</span>
            </div>
            <div className="rounded border border-[#132c52] bg-[#08162b] p-1.5 space-y-1">
              <div className="text-slate-400">{label('Media and identity probe', 'فحص الوسائط والهوية')}</div>
              {volumes.length ? volumes.slice(0, 4).map((volume) => (
                <div key={volume.id} className="flex justify-between font-mono text-[9px]">
                  <span className="text-slate-300">{volume.letter} {volume.fileSystem}</span>
                  <span className="text-amber-300">{label('media type unavailable', 'نوع الوسائط غير متاح')}</span>
                </div>
              )) : <div className="text-amber-300 text-[9px]">{label('No measured volumes to probe.', 'لا توجد أحجام مقيسة للفحص.')}</div>}
              {probe && <div className="text-[9px] text-cyan-300">{label('Last probe attempt', 'آخر محاولة فحص')} {probe.at}</div>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button data-testid="storage-frag-probe" onClick={() => void probeNow()} className={actionButton}><RefreshCw className="w-3 h-3 inline me-1" />{label('Probe support', 'فحص الدعم')}</button>
              <button
                data-testid="storage-frag-copy"
                disabled={!volumes.length}
                onClick={() => onCopy('Optimization dossier', [
                  'service: storage-fragmentation',
                  'operation: none — no defrag/TRIM channel is allowlisted',
                  `probedAt: ${probe?.at || new Date().toISOString()}`,
                  `volumes: ${volumes.length}`,
                  measuredVolumesText(),
                ].join('\n'))}
                className={quietButton}
              >{label('Copy dossier', 'نسخ الملف')}</button>
              <button data-testid="storage-frag-open-cleanup" onClick={onNavigateCleanup} className={quietButton}>{label('Open Cleanup', 'فتح التنظيف')}</button>
            </div>
          </div>
        );
      case 'storage-smart': {
        return (
          <div className="space-y-2 text-[10px]">
            <div className="text-rose-200 flex items-start gap-2">
              <Activity className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{label(
                'No supported health provider is exposed, so no reliability score is shown. The probe reports exactly what the measured provider returns instead of inventing telemetry.',
                'لا يوجد مزود صحة مدعوم، لذلك لا تُعرض درجة موثوقية. يبلّغ الفحص عما يعيده المزود المقيس فعلًا بدلًا من اختلاق القياسات.',
              )}</span>
            </div>
            {metricRow(label('Volumes probed', 'الأحجام المفحوصة'), volumes.length.toString())}
            {metricRow(label('Volumes with SMART', 'أحجام تدعم SMART'), `${smartCount} / ${volumes.length}`)}
            {metricRow(label('Volumes with identity', 'أحجام بهوية فيزيائية'), `${identityCount} / ${volumes.length}`)}
            {volumes.slice(0, 4).map((volume) => (
              <div key={volume.id} className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-slate-300">{volume.letter} {volume.fileSystem}</span>
                <span className="text-amber-300">{label('SMART unavailable', 'SMART غير متاح')}</span>
              </div>
            ))}
            {probe && (
              <div className="rounded border border-[#132c52] bg-[#08162b] p-1.5 text-[9px] font-mono text-cyan-300">
                {probe.at} · {volumes.length} {label('volumes', 'حجمًا')} · {smartCount} SMART · {identityCount} {label('identities', 'هوية')}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              <button data-testid="storage-smart-probe" onClick={() => void probeNow()} className={actionButton}>{label('Start diagnostic', 'بدء التشخيص')}</button>
              <button
                data-testid="storage-smart-copy"
                disabled={!volumes.length}
                onClick={() => onCopy('SMART diagnostic', [
                  'service: storage-smart',
                  `probedAt: ${probe?.at || new Date().toISOString()}`,
                  `volumes: ${volumes.length}`,
                  `smartAvailable: ${smartCount}`,
                  `physicalIdentityAvailable: ${identityCount}`,
                  measuredVolumesText(),
                ].join('\n'))}
                className={quietButton}
              >{label('Copy proof', 'نسخ الدليل')}</button>
              <button data-testid="storage-smart-baseline" disabled title={label('No historical SMART sample exists to compare.', 'لا توجد عينة SMART تاريخية للمقارنة.')} className={quietButton}>
                {label('Compare baseline', 'مقارنة الأساس')}
              </button>
            </div>
          </div>
        );
      }
      case 'storage-reclaim': {
        const verifiedBytes = duplicates?.summary.reclaimableVerifiedBytes || 0;
        const largestBytes = (analysis?.largest || []).slice(0, 5).reduce((sum, item) => sum + item.size, 0);
        const candidates = duplicates?.summary.verifiedGroups || analysis?.duplicateCandidates.length || 0;
        return (
          <div className="space-y-2 text-[10px]">
            <div className="text-rose-200 flex items-start gap-2"><ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /><span>{label(
              'This page deletes nothing. The numbers below are measured review candidates, not a deletion plan, and every plan must be staged and reviewed in Cleanup or Studio.',
              'هذه الصفحة لا تحذف شيئًا. الأرقام أدناه مرشحات مقيسة للمراجعة وليست خطة حذف، وكل خطة تُجهّز وتُراجع في التنظيف أو الاستوديو.',
            )}</span></div>
            {metricRow(label('Verified duplicate bytes', 'بايتات تكرار مؤكدة'), formatStorageBytes(verifiedBytes))}
            {metricRow(label('Duplicate groups', 'مجموعات التكرار'), candidates.toString())}
            {metricRow(label('Top-5 largest files', 'أكبر 5 ملفات'), formatStorageBytes(largestBytes))}
            {!duplicates && <div className="text-[9px] text-amber-300">{label('Run content verification in Duplicates to confirm reclaimable bytes.', 'شغّل تحقق المحتوى في التكرار لتأكيد البايتات القابلة للاستعادة.')}</div>}
            <div className="flex flex-wrap gap-1.5">
              <button
                data-testid="storage-reclaim-copy"
                onClick={() => onCopy('Reclaim candidates', [
                  'service: storage-reclaim',
                  'permission: read-only',
                  `verifiedDuplicateBytes: ${verifiedBytes}`,
                  `duplicateGroups: ${candidates}`,
                  `topFiveLargestBytes: ${largestBytes}`,
                  `scope: ${analysis?.coverage?.scope || 'none'}`,
                ].join('\n'))}
                className={quietButton}
              >{label('Copy brief', 'نسخ الموجز')}</button>
              <button data-testid="storage-reclaim-cleanup" onClick={onOpenVault} className={actionButton}>{label('Open Safety Vault', 'فتح خزنة الأمان')}</button>
              <button data-testid="storage-reclaim-studio" onClick={onNavigateStudio} className={quietButton}>{label('Open Studio', 'فتح الاستوديو')}</button>
            </div>
          </div>
        );
      }
      case 'storage-history': {
        const freeTotal = (point: StorageCapacityPoint) => point.volumes.reduce((sum, volume) => sum + (volume.freeBytes || 0), 0);
        return (
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-400" />{history.length.toLocaleString()} {label('capacity snapshots', 'لقطة سعة')}</div>
            {history.slice(-3).reverse().map((point) => (
              <div key={point.capturedAt} className="flex items-center justify-between gap-2 font-mono">
                <span className="text-slate-500">{new Date(point.capturedAt).toLocaleString()}</span>
                <span className="text-cyan-300">{formatStorageBytes(freeTotal(point))} free</span>
              </div>
            ))}
            {!history.length && <div className="text-amber-300">{label('No snapshots captured yet.', 'لا توجد لقطات بعد.')}</div>}
            <div className="flex gap-1.5">
              <button
                data-testid="storage-history-copy"
                disabled={!history.length}
                onClick={() => onCopy('Capacity trend', history.map((point) => `${point.capturedAt}\t${freeTotal(point)} free`).join('\n'))}
                className={quietButton}
              >{label('Copy trend', 'نسخ الاتجاه')}</button>
              <button data-testid="storage-history-files" onClick={onNavigateFiles} className={actionButton}>{label('Open Files scope', 'فتح نطاق الملفات')}</button>
            </div>
          </div>
        );
      }
      case 'storage-removable': {
        const dockVolumes = volumes.filter(volume => dockType === 'all' || (dockType === 'unknown' ? ![2, 3].includes(volume.driveType ?? -1) : volume.driveType === Number(dockType)))
          .filter(volume => `${volume.letter} ${volume.label} ${volume.fileSystem}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
        const typeLabel = (volume: StorageVolume) => volume.driveType === 2 ? label('Removable', 'قابل للإزالة') : volume.driveType === 3 ? label('Fixed', 'ثابت') : label('Unknown / other', 'غير معروف / آخر');
        return (
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <p>{label('Windows classifies the logical drive. Some external USB disks are classified as fixed; USB transport and physical identity are not inferred. No eject operation is exposed.', 'Windows يصنّف الوحدة المنطقية. بعض أقراص USB الخارجية تُصنّف ثابتة؛ لا نستنتج ناقل USB أو الهوية الفيزيائية. لا تتوفر عملية إخراج.')}</p>
            <div className="knx-tool-controls">
              <label>{label('Drive type', 'نوع الوحدة')}<select data-testid="storage-dock-type" value={dockType} onChange={e => setDockType(e.target.value)}><option value="2">{label('Removable', 'قابل للإزالة')} ({volumes.filter(v => v.driveType === 2).length})</option><option value="3">{label('Fixed', 'ثابت')} ({volumes.filter(v => v.driveType === 3).length})</option><option value="unknown">{label('Unknown / other', 'غير معروف / آخر')}</option><option value="all">{label('All measured volumes', 'كل الوحدات المقيسة')}</option></select></label>
              <label>{label('Find volume', 'البحث عن وحدة')}<input data-testid="storage-dock-search" type="search" value={query} onChange={e => setQuery(e.target.value)}/></label>
            </div>
            {dockVolumes.map((volume) => (
              <section key={volume.id} className="knx-tool-evidence" data-testid="storage-dock-volume">
                <h3>{volume.letter} {volume.label} · {typeLabel(volume)}</h3>
                <dl className="knx-file-metadata-grid"><div><dt>{label('File system', 'نظام الملفات')}</dt><dd>{volume.fileSystem}</dd></div><div><dt>{label('Capacity', 'السعة')}</dt><dd>{volume.capacityAvailable === false ? '—' : formatStorageBytes(volume.totalBytes)}</dd></div><div><dt>{label('Used', 'مستخدم')}</dt><dd>{volume.capacityAvailable === false ? '—' : formatStorageBytes(volume.usedBytes)}</dd></div><div><dt>{label('Free', 'متاح')}</dt><dd>{volume.capacityAvailable === false ? '—' : formatStorageBytes(volume.freeBytes)}</dd></div></dl>
                {volume.capacityAvailable === false ? <p>{label('Capacity unavailable. Check that readable media is inserted and refresh.', 'السعة غير متاحة. تأكد من إدخال وسائط قابلة للقراءة وحدّث.')}</p> : <meter min={0} max={100} value={volume.usedPercent} aria-label={label(`${volume.letter} space used`, `المساحة المستخدمة في ${volume.letter}`)}/>}
                {volume.isLowSpace && <p className="knx-tool-error">{label('Low space', 'مساحة منخفضة')}</p>}
              </section>
            ))}
            {!dockVolumes.length && <p role="status">{volumes.length ? label('No measured volume matches these filters. Connect media and refresh, or inspect fixed / unknown drives.', 'لا توجد وحدة مقيسة تطابق الفلاتر. صِل الوسائط وحدّث، أو راجع الوحدات الثابتة / غير المعروفة.') : label('No volumes measured.', 'لا توجد أحجام مقيسة.')}</p>}
            <div className="flex gap-1.5">
              <button data-testid="storage-removable-refresh" onClick={() => void onRefreshVolumes()} className={actionButton}><HardDrive className="w-3 h-3 inline me-1" />{label('Refresh dock', 'تحديث القاعدة')}</button>
              <button
                data-testid="storage-removable-copy"
                disabled={!dockVolumes.length}
                onClick={() => onCopy('Volume dock', dockVolumes.map(v => `${v.letter}\t${v.label}\tDriveType=${v.driveType ?? 'unknown'}\t${v.fileSystem}\t${v.capacityAvailable === false ? 'capacity unavailable' : `${v.totalBytes} total bytes\t${v.freeBytes} free bytes`}`).join('\n'))}
                className={quietButton}
              >{label('Copy list', 'نسخ القائمة')}</button>
            </div>
          </div>
        );
      }
      default:
        return <div className="text-[10px] text-amber-300">{label('Unknown service.', 'خدمة غير معروفة.')}</div>;
    }
  };

  if (embedded) {
    return (
      <div data-testid="storage-service-focus" data-tool-body="storage" data-tool={serviceKey} className="space-y-2">
        <p className="text-[10px] text-slate-400">{isArabic ? meta.descAr : meta.descEn}</p>
        {error ? <p role="alert" className="knx-tool-error">{error}</p> : null}
        {working ? <div className="knx-tool-context" role="status"><progress aria-label={label('Native provider reading','المزود الأصلي يقرأ')}/><span>{label('Waiting for native provider…','بانتظار المزود الأصلي…')}</span>{cancelable ? <button type="button" onClick={onCancel}>{label('Cancel scan','إلغاء الفحص')}</button> : null}</div> : null}
        <fieldset disabled={working} className="knx-tool-fieldset" data-testid={`storage-${serviceKey}-workbench`}>{renderBody()}</fieldset>
      </div>
    );
  }

  return (
    <div data-testid="storage-service-focus" data-tool-body="storage" data-tool={serviceKey} className="bg-[#07152b] rounded-xl p-3 border border-[#2476ff]/40 space-y-2 shadow-[0_0_12px_rgba(36,118,255,0.15)]">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#0f2545]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white min-w-0">
          <Copy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{isArabic ? meta.ar : meta.en}</span>
          <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${measured ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
            {measured ? (isArabic ? 'مقيس' : 'MEASURED') : (isArabic ? 'تجريبي' : 'FIXTURE')}
          </span>
        </div>
        <button onClick={onClose} aria-label={isArabic ? 'إغلاق' : 'Close'} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
      </div>
      <p className="text-[10px] text-slate-400">{isArabic ? meta.descAr : meta.descEn}</p>
      <div data-testid={`storage-${serviceKey}-workbench`}>{renderBody()}</div>
    </div>
  );
}
