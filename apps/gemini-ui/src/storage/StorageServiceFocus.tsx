import React, { useState } from 'react';
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
} from '../../shared/native-contracts';
import { formatStorageBytes } from './useStorageNative';
import type { StorageTabKey } from './StorageTabContent';

interface StorageServiceFocusProps {
  serviceKey: string;
  isArabic: boolean;
  volumes: StorageVolume[];
  analysis: StorageAnalysis | null;
  duplicates: StorageDuplicateResult | null;
  history: StorageCapacityPoint[];
  verifying: boolean;
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
  'storage-removable': { en: 'Removable Dock', ar: 'قاعدة الوسائط', descEn: 'Measured volume list; drive type is not exposed by this provider.', descAr: 'قائمة أحجام مقيسة؛ المزود الحالي لا يعرض نوع محرك الأقراص.' },
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
    .map((volume) => `${volume.letter} ${volume.label} | ${volume.fileSystem} | ${formatStorageBytes(volume.usedBytes)} used / ${formatStorageBytes(volume.totalBytes)} | free ${formatStorageBytes(volume.freeBytes)}`)
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
        const largest = (analysis?.largest || []).slice(0, 5);
        return (
          <div className="space-y-1.5">
            {largest.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-slate-300 truncate" title={item.relative}>{item.name}</span>
                <span className="font-mono text-cyan-300 shrink-0">{formatStorageBytes(item.size)}</span>
              </div>
            ))}
            {!analysis && <div className="text-[10px] text-amber-300">{label('Index a scope to list large files.', 'افهرس نطاقًا لعرض الملفات الكبيرة.')}</div>}
            {analysis && (
              <div className="text-[9px] text-slate-500">
                {label(`Largest ${largest.length} of ${analysis.totals.files} indexed files ·`, `أكبر ${largest.length} من ${analysis.totals.files} ملفًا مفهرسًا ·`)} {formatStorageBytes(analysis.totals.bytes)}
              </div>
            )}
            <div className="flex gap-1.5">
              <button data-testid="storage-large-open-ledger" onClick={() => onTab('large')} className={actionButton}>{label('Open ledger', 'فتح السجل')}<ArrowRight className="w-3 h-3 inline ms-1" /></button>
              <button
                data-testid="storage-large-copy"
                disabled={!largest.length}
                onClick={() => onCopy('Largest files', largest.map((item) => `${formatStorageBytes(item.size)}\t${item.relative}`).join('\n'))}
                className={quietButton}
              >{label('Copy list', 'نسخ القائمة')}</button>
            </div>
          </div>
        );
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
                    {duplicates.groups.slice(0, 2).map((group) => (
                      <div key={group.digest} className="rounded border border-[#132c52] bg-[#08162b] p-1.5 text-[9px] font-mono space-y-0.5">
                        <div className="text-cyan-300">{group.digest.slice(0, 16)}…</div>
                        <div className="text-slate-400">{group.count} × {formatStorageBytes(group.size)} · {formatStorageBytes(group.wastedBytes)} {label('wasted', 'مهدور')}</div>
                        <div className="text-slate-500 truncate">{group.files.map((file) => file.name).join(' · ')}</div>
                      </div>
                    ))}
                    {duplicates.summary.budgetReached && <div className="text-amber-300 text-[9px]">{label('Partial due to the bounded hashing budget.', 'النتيجة جزئية بسبب حد التجزئة.')}</div>}
                    {duplicates.errors.length > 0 && <div className="text-amber-300 text-[9px]">{label(`${duplicates.errors.length} file(s) were excluded because they changed or failed to hash.`, `استُبعد ${duplicates.errors.length} ملفًا لتغيّره أو فشل تجزئته.`)}</div>}
                    <button data-testid="storage-duplicates-open-vault" onClick={onOpenVault} className={quietButton}>{label('Review keepers in the Safety Vault', 'مراجعة النسخ المحتفظ بها في خزنة الأمان')}</button>
                  </div>
                )}
              </>
            ) : <div className="text-[10px] text-amber-300">{label('Index a scope for duplicate analysis.', 'افهرس نطاقًا لتحليل التكرار.')}</div>}
          </div>
        );
      case 'storage-treemap': {
        const children = analysis?.tree.children || [];
        const biggest = children[0];
        return (
          <div className="space-y-2 text-[10px] text-slate-300">
            {analysis ? (
              <>
                {metricRow(label('Folders modeled', 'العقد'), analysis.folders.length.toString())}
                {metricRow(label('Indexed bytes', 'الحجم المفهرس'), formatStorageBytes(analysis.totals.bytes))}
                {biggest && metricRow(label('Largest node', 'أكبر عقدة'), `${biggest.name} · ${formatStorageBytes(biggest.sizeBytes)}`)}
                {metricRow(label('Nodes returned', 'العقد المعادة'), children.length.toString())}
                <div className="text-slate-500 font-mono truncate">{analysis.coverage?.scope || '—'}</div>
                {analysis.coverage?.partial && <div className="text-amber-300 text-[9px]">{label('Partial coverage or node limit reached.', 'تغطية جزئية أو بلوغ حد العقد.')}</div>}
                <button data-testid="storage-treemap-open" onClick={() => onTab('treemap')} className={actionButton}>{label('Open map', 'فتح الخريطة')}<ArrowRight className="w-3 h-3 inline ms-1" /></button>
              </>
            ) : <div className="text-amber-300">{label('Index a scope to build the map.', 'افهرس نطاقًا لبناء الخريطة.')}</div>}
          </div>
        );
      }
      case 'storage-top-folders': {
        const folders = (analysis?.folders || []).slice(0, 6);
        const total = analysis?.totals.analyzedBytes || 0;
        return (
          <div className="space-y-1.5">
            {folders.map((folder) => (
              <div key={folder.id} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-slate-300 truncate">{folder.name}</span>
                  <span className="font-mono text-cyan-300">{formatStorageBytes(folder.sizeBytes)} · {share(folder.sizeBytes, total)}%</span>
                </div>
                <div className="h-0.5 rounded bg-[#0a1c38] overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${share(folder.sizeBytes, total)}%` }} />
                </div>
              </div>
            ))}
            {!analysis && <div className="text-[10px] text-amber-300">{label('No measured folders.', 'لا توجد مجلدات مقيسة.')}</div>}
            <button data-testid="storage-folders-open" onClick={() => onTab('folders')} className={actionButton}>{label('Open ranking', 'فتح الترتيب')}<ArrowRight className="w-3 h-3 inline ms-1" /></button>
          </div>
        );
      }
      case 'storage-filetypes': {
        const extensions = (analysis?.extensions || []).slice(0, 6);
        const total = analysis?.totals.bytes || 0;
        return (
          <div className="space-y-1.5">
            {extensions.map((item) => (
              <div key={item.ext} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-slate-300 font-mono">.{item.ext}</span>
                  <span className="font-mono text-slate-400">{item.count.toLocaleString()} · {formatStorageBytes(item.bytes)}</span>
                </div>
                <div className="h-0.5 rounded bg-[#0a1c38] overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${share(item.bytes, total)}%` }} />
                </div>
              </div>
            ))}
            <button data-testid="storage-types-open" onClick={() => onTab('types')} className={actionButton}>{label('Open types', 'فتح الأنواع')}<ArrowRight className="w-3 h-3 inline ms-1" /></button>
          </div>
        );
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
              {probe && <div className="text-[9px] text-cyan-300">{label('Probed', 'تم الفحص')} {probe.at}</div>}
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
      case 'storage-removable':
        return (
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="text-amber-300">{label('Drive type is not exposed by the current provider, so removable media cannot be distinguished from fixed disks. Every row below is a measured volume.', 'نوع محرك الأقراص غير متاح من المزود الحالي، لذا لا يمكن تمييز الوسائط القابلة للإزالة عن الأقراص الثابتة. كل صف أدناه حجم مقيس.')}</div>
            {volumes.slice(0, 6).map((volume) => (
              <div key={volume.id} className="flex justify-between font-mono"><span>{volume.letter} {volume.fileSystem}</span><span>{formatStorageBytes(volume.usedBytes)} / {formatStorageBytes(volume.totalBytes)}</span></div>
            ))}
            {!volumes.length && <div className="text-amber-300">{label('No volumes measured.', 'لا توجد أحجام مقيسة.')}</div>}
            <div className="flex gap-1.5">
              <button data-testid="storage-removable-refresh" onClick={() => void onRefreshVolumes()} className={actionButton}><HardDrive className="w-3 h-3 inline me-1" />{label('Refresh dock', 'تحديث القاعدة')}</button>
              <button
                data-testid="storage-removable-copy"
                disabled={!volumes.length}
                onClick={() => onCopy('Volume dock', measuredVolumesText())}
                className={quietButton}
              >{label('Copy list', 'نسخ القائمة')}</button>
            </div>
          </div>
        );
      default:
        return <div className="text-[10px] text-amber-300">{label('Unknown service.', 'خدمة غير معروفة.')}</div>;
    }
  };

  if (embedded) {
    return (
      <div data-testid="storage-service-focus" className="space-y-2">
        <p className="text-[10px] text-slate-400">{isArabic ? meta.descAr : meta.descEn}</p>
        <div data-testid={`storage-${serviceKey}-workbench`}>{renderBody()}</div>
      </div>
    );
  }

  return (
    <div data-testid="storage-service-focus" className="bg-[#07152b] rounded-xl p-3 border border-[#2476ff]/40 space-y-2 shadow-[0_0_12px_rgba(36,118,255,0.15)]">
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
