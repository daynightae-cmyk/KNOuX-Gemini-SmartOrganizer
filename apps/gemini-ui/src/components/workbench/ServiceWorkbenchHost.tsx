/**
 * KNOuX typed Service Workbench Host.
 *
 * One reusable host for pinned side and expanded workbenches. The host owns
 * chrome, resize, focus/Escape, mode persistence and scrolling; each service
 * supplies its own specialized body. It is intentionally not a generic modal:
 * side mode sits in the page's trailing rail and expanded mode fills the main
 * content area without covering the global titlebar or footer.
 */
import React, { useEffect, useRef } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

export type WorkbenchMode = 'side' | 'expanded';

export interface ServiceWorkbenchHostProps {
  serviceId: string;
  title: string;
  subtitle?: string;
  locale: 'en' | 'ar';
  mode: WorkbenchMode;
  onModeChange: (mode: WorkbenchMode) => void;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  toolSelector?: React.ReactNode;
  onResize?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  testId?: string;
}

export function ServiceWorkbenchHost({
  serviceId,
  title,
  subtitle,
  locale,
  mode,
  onModeChange,
  onClose,
  children,
  footer,
  toolSelector,
  onResize,
  minWidth = 320,
  maxWidth = 760,
  testId,
}: ServiceWorkbenchHostProps) {
  const isAr = locale === 'ar';
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const beginResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'side' || !onResize || !rootRef.current) return;
    event.preventDefault();
    const rect = rootRef.current.getBoundingClientRect();
    dragRef.current = { x: event.clientX, width: rect.width };
    rootRef.current.setPointerCapture?.(event.pointerId);
  };

  const moveResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !onResize) return;
    const direction = rootRef.current ? getComputedStyle(rootRef.current).direction : 'ltr';
    const delta = direction === 'rtl' ? event.clientX - dragRef.current.x : dragRef.current.x - event.clientX;
    const next = Math.max(minWidth, Math.min(maxWidth, Math.round(dragRef.current.width + delta)));
    onResize(next);
  };

  const endResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      rootRef.current?.releasePointerCapture?.(event.pointerId);
    }
  };

  return (
    <div
      ref={rootRef}
      data-testid={testId || `workbench-${serviceId}`}
      data-workbench-mode={mode}
      dir={isAr ? 'rtl' : 'ltr'}
      className={
        mode === 'expanded'
          ? 'absolute inset-0 z-50 flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#2476ff]/60 bg-[#040d1c] shadow-2xl'
          : 'relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#2476ff]/50 bg-[#07152b] shadow-[0_0_18px_rgba(36,118,255,0.18)]'
      }
      aria-label={title}
    >
      {mode === 'side' && onResize ? (
        <div
          role="separator"
          aria-label={isAr ? 'تغيير عرض مساحة العمل' : 'Resize workbench'}
          aria-orientation="vertical"
          tabIndex={0}
          className="absolute inset-y-0 start-0 z-10 w-1.5 cursor-col-resize bg-transparent hover:bg-cyan-400/60"
          onPointerDown={beginResize}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onKeyDown={(event) => {
            if (!onResize || !rootRef.current) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              const rect = rootRef.current.getBoundingClientRect();
              const delta = event.key === 'ArrowRight' ? 24 : -24;
              onResize(Math.max(minWidth, Math.min(maxWidth, Math.round(rect.width + (isAr ? -delta : delta)))));
            }
          }}
        />
      ) : null}
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-[#0f2545] px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono uppercase tracking-wide text-cyan-300">{serviceId}</span>
            <span className="text-[8px] font-mono px-1 py-0.5 rounded border border-[#1b3f70] text-slate-400">{mode === 'side' ? (isAr ? 'جانبية' : 'SIDE') : (isAr ? 'موسعة' : 'EXPANDED')}</span>
          </div>
          <h2 className="truncate text-xs font-bold text-white">{title}</h2>
          {subtitle ? <p className="truncate text-[10px] text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {toolSelector}
          <button
            type="button"
            onClick={() => onModeChange(mode === 'side' ? 'expanded' : 'side')}
            className="rounded p-1 text-slate-400 hover:bg-[#102952] hover:text-white"
            title={mode === 'side' ? (isAr ? 'توسيع مساحة العمل' : 'Expand workbench') : (isAr ? 'تثبيت جانبي' : 'Pin to side')}
            aria-label={mode === 'side' ? (isAr ? 'توسيع مساحة العمل' : 'Expand workbench') : (isAr ? 'تثبيت جانبي' : 'Pin to side')}
            data-testid="workbench-mode-toggle"
          >
            {mode === 'side' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-[#102952] hover:text-white"
            title={isAr ? 'إغلاق مساحة العمل' : 'Close workbench'}
            aria-label={isAr ? 'إغلاق مساحة العمل' : 'Close workbench'}
            data-testid="workbench-close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto files-scrollbar p-3">{children}</div>
      {footer ? <footer className="shrink-0 border-t border-[#0f2545] px-3 py-2 text-[10px] text-slate-400">{footer}</footer> : null}
    </div>
  );
}
