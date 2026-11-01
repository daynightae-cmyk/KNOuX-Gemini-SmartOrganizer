/**
 * KNOuX typed Service Workbench Host.
 *
 * One reusable host for pinned side and expanded workbenches. The host owns
 * chrome, resize, focus/Escape, mode persistence and scrolling; each service
 * supplies its own specialized body. It is intentionally not a generic modal:
 * side mode sits in the page's trailing rail and expanded mode fills the main
 * content area without covering the global titlebar or footer.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

export type WorkbenchMode = 'side' | 'expanded';

export interface ServiceWorkbenchHostProps {
  serviceId: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
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
  icon,
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
  const titleId = useId();
  const callbacks = useRef({ onClose, onResize });
  callbacks.current = { onClose, onResize };
  const [actualWidth, setActualWidth] = useState(minWidth);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('dialog[open], [aria-modal="true"]')) callbacks.current.onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const element = rootRef.current;
    const observer = new ResizeObserver(() => element && setActualWidth(Math.round(element.getBoundingClientRect().width)));
    if (element) observer.observe(element);
    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const resizeBounds = () => {
    const maximum = Math.max(160, Math.min(maxWidth, window.innerWidth - 24));
    return { minimum: Math.min(minWidth, maximum), maximum };
  };
  const resize = (width: number) => {
    const { minimum, maximum } = resizeBounds();
    callbacks.current.onResize?.(Math.max(minimum, Math.min(maximum, Math.round(width))));
  };
  const beginResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'side' || !onResize || !rootRef.current) return;
    event.preventDefault();
    dragRef.current = { x: event.clientX, width: rootRef.current.getBoundingClientRect().width };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta = isAr ? event.clientX - dragRef.current.x : dragRef.current.x - event.clientX;
    resize(dragRef.current.width + delta);
  };
  const endResize = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={rootRef}
      data-testid={testId || `workbench-${serviceId}`}
      data-workbench-mode={mode}
      data-service-workbench="true"
      data-service-id={serviceId}
      dir={isAr ? 'rtl' : 'ltr'}
      className={`knx-service-workspace ${mode === 'expanded' ? 'is-expanded absolute inset-0 z-50' : 'is-side relative h-full'} flex min-h-0 flex-col overflow-hidden`}
      role="region"
      aria-labelledby={titleId}
    >
      {mode === 'side' && onResize ? (
        <div
          role="separator"
          aria-label={isAr ? 'تغيير عرض مساحة العمل' : 'Resize workbench'}
          aria-orientation="vertical"
          tabIndex={0}
          className="knx-workbench-resizer absolute inset-y-0 start-0 z-10 w-1.5 cursor-col-resize"
          aria-valuenow={actualWidth}
          aria-valuemin={Math.min(minWidth, actualWidth)}
          aria-valuemax={Math.max(maxWidth, actualWidth)}
          onPointerDown={beginResize}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onKeyDown={(event) => {
            if (!onResize || !rootRef.current) return;
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
              event.preventDefault();
              const { minimum, maximum } = resizeBounds();
              const delta = (event.key === 'ArrowLeft' ? 24 : -24) * (isAr ? -1 : 1);
              resize(event.key === 'Home' ? minimum : event.key === 'End' ? maximum : rootRef.current.getBoundingClientRect().width + delta);
            }
          }}
        />
      ) : null}
      <header className="knx-workbench-heading">
        {icon ? <span className="knx-workbench-icon" aria-hidden="true">{icon}</span> : null}
        {/* flex-1: the label block owns the remaining width, so a service title
            is only truncated when the header is genuinely too narrow for it.
            Without it the block shrank to its widest child and long titles
            were cut while empty space sat beside them. */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="knx-workbench-id">{serviceId}</span>
            <span className="knx-workbench-mode">{mode === 'side' ? (isAr ? 'جانبية' : 'SIDE') : (isAr ? 'موسعة' : 'EXPANDED')}</span>
          </div>
          <h2 id={titleId} title={title}>{title}</h2>
          {subtitle ? <p title={subtitle}>{subtitle}</p> : null}
        </div>
        <div className="knx-workbench-actions">
          {toolSelector}
          <button
            type="button"
            onClick={() => onModeChange(mode === 'side' ? 'expanded' : 'side')}
            className="knx-workbench-action"
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
            className="knx-workbench-action"
            title={isAr ? 'إغلاق مساحة العمل' : 'Close workbench'}
            aria-label={isAr ? 'إغلاق مساحة العمل' : 'Close workbench'}
            data-testid="workbench-close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
      <div className="knx-workbench-content min-h-0 flex-1 overflow-y-auto files-scrollbar p-3">{children}</div>
      {footer ? <footer className="knx-workbench-footer">{footer}</footer> : null}
    </div>
  );
}
