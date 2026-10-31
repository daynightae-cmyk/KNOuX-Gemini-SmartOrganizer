/**
 * KNOuX SmartOrganizer — measured service command deck.
 *
 * The ten services are the real capability list reported by the native
 * coordinator. A tile opens the service workspace; it never implies that the
 * service has already run.
 */
import React, { useCallback, useRef } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Copy,
  Grid,
  HardDrive,
  Layers,
  Lightbulb,
  Rocket,
  Search,
  Settings,
  Shield,
  Trash2,
  Zap,
} from 'lucide-react';
import type { ScanServiceResult } from '../../shared/native-contracts';
import type { ScanServiceMeta } from './smartScan.types';
import { sessionStatusLabel } from './model';

export interface ScanServicesProps {
  services: ScanServiceMeta[];
  results?: ScanServiceResult[];
  activeServiceId?: string | null;
  onSelectService: (service: ScanServiceMeta) => void;
  onOpenCustomScan: () => void;
  isArabic?: boolean;
  nativeAvailable?: boolean;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Search,
  Copy,
  HardDrive,
  Trash2,
  Shield,
  Rocket,
  Grid,
  Activity,
  Lightbulb,
};

export function scanServiceIcon(name: string) {
  const Icon = ICONS[name] || Lightbulb;
  return <Icon className="w-6 h-6" />;
}

export const ScanServices: React.FC<ScanServicesProps> = ({
  services,
  results = [],
  activeServiceId,
  onSelectService,
  onOpenCustomScan,
  isArabic = false,
  nativeAvailable = true,
}) => {
  const resultById = new Map(results.map((result) => [result.serviceId, result]));
  const stripRef = useRef<HTMLDivElement | null>(null);

  // The dock is a horizontal strip, so it must stay reachable without a mouse
  // wheel: the arrows move it by one visible page in the reading direction.
  const scrollStrip = useCallback((direction: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * (isArabic ? -1 : 1), behavior: 'smooth' });
  }, [isArabic]);

  return (
    <section data-testid="scan-services" className="scan-services bg-[#071329]/80 border border-[#11294a] rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-lg shrink-0">
      <div className="scan-services-head flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            {isArabic ? 'خدمات الفحص المقيسة' : 'Measured Scan Services'}
            {services.length ? (
              <span data-testid="scan-services-count" className="px-1.5 py-0.5 rounded bg-[#0e213d] border border-[#1b3a63] text-[9px] font-mono font-bold text-slate-300">
                {services.length}
              </span>
            ) : null}
          </h2>
          <p className="scan-services-copy text-[11px] text-slate-300 mt-0.5 font-medium">
            {isArabic
              ? 'كل خدمة تعرض ما قاسته فعليًا؛ النطاقات غير المدعومة معلنة وليست مخفية.'
              : 'Each service shows what it actually measured; unsupported scope is disclosed, not hidden.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="scan-services-prev"
            onClick={() => scrollStrip(-1)}
            aria-label={isArabic ? 'تمرير الخدمات لليمين' : 'Scroll services left'}
            className="p-1.5 rounded-lg bg-[#0e213d] hover:bg-[#163158] border border-cyan-500/30 text-cyan-300 transition cursor-pointer"
          >
            {isArabic ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            data-testid="scan-services-next"
            onClick={() => scrollStrip(1)}
            aria-label={isArabic ? 'تمرير الخدمات لليسار' : 'Scroll services right'}
            className="p-1.5 rounded-lg bg-[#0e213d] hover:bg-[#163158] border border-cyan-500/30 text-cyan-300 transition cursor-pointer"
          >
            {isArabic ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onOpenCustomScan}
            disabled={!nativeAvailable || !services.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e213d] hover:bg-[#163158] border border-cyan-500/30 text-xs text-cyan-300 font-bold transition cursor-pointer shadow-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isArabic ? 'فحص مخصص' : 'Custom Scan'}</span>
          </button>
        </div>
      </div>

      {services.length ? (
        <div ref={stripRef} data-testid="scan-services-strip" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {services.map((service) => {
            const IconComp = ICONS[service.iconName] || Lightbulb;
            const isSelected = activeServiceId === service.id;
            const result = resultById.get(service.id);
            return (
              <button
                type="button"
                key={service.id}
                data-testid={`scan-service-${service.id}`}
                onClick={() => onSelectService(service)}
                className={`scan-service-card group relative bg-[#091a38]/80 hover:bg-[#0f2852] border rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer shadow-sm text-start ${
                  isSelected
                    ? 'border-cyan-400/80 bg-[#0e2850] shadow-[0_0_15px_rgba(38,198,218,0.3)]'
                    : 'border-[#14325a] hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(38,198,218,0.2)]'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${service.accentGradient} flex items-center justify-center shrink-0 shadow-md text-white border border-white/20 group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-4 h-4 text-white" />
                  </div>
                  <div className="truncate min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white truncate group-hover:text-cyan-200">{isArabic ? service.titleAr : service.titleEn}</span>
                      {service.badge ? (
                        <span className={`px-1 py-0.2 rounded text-[8px] font-bold border shrink-0 ${service.state === 'gated' ? 'bg-rose-400/15 text-rose-300 border-rose-400/40' : 'bg-amber-400/15 text-amber-300 border-amber-400/40'}`}>
                          {service.badge}
                        </span>
                      ) : null}
                    </div>
                    <span className="scan-service-sub text-[10px] text-slate-400 truncate block">
                      {isArabic ? service.subtextAr : service.subtextEn}
                    </span>
                    {result ? (
                      <span className="text-[8px] font-mono text-emerald-400/90 truncate block">
                        {isArabic ? 'آخر نتيجة' : 'last result'}: {sessionStatusLabel(result.status === 'unsupported' ? 'partial' : result.status, isArabic)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform shrink-0 ${isArabic ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#1b3a63] bg-[#071731] p-3 text-center text-[11px] text-slate-400">
          {nativeAvailable
            ? (isArabic ? 'جارٍ تحميل قدرات الفحص من الجسر الأصلي...' : 'Loading measured capabilities from the native bridge...')
            : (isArabic ? 'قدرات الفحص تتطلب تطبيق Electron الأصلي؛ لا تُعرض خدمات تجريبية في المعاينة.' : 'Scan capabilities require the native Electron app; no design services are shown in a browser preview.')}
        </div>
      )}
    </section>
  );
};
