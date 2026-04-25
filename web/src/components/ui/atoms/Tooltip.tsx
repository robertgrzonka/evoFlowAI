'use client';

import { clsx } from 'clsx';
import { useCallback, useLayoutEffect, useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  inline?: boolean;
  className?: string;
  /**
   * Narrow rail (e.g. collapsed sidebar): show label to the right of the trigger.
   * Rendered in a document portal with position:fixed so scroll parents (overflow-y-auto)
   * do not clip the bubble (CSS treats the other overflow axis as non-visible).
   */
  rail?: boolean;
  /**
   * Portal + fixed positioning, clamped to the viewport — avoids overflow:hidden ancestors
   * and keeps long wrapped copy readable (e.g. dashboard stat pills).
   */
  anchored?: boolean;
};

const TOOLTIP_MAX_W = 22 * 16; // 22rem ≈ 352px

export default function Tooltip({
  content,
  children,
  side = 'top',
  inline = true,
  className = '',
  rail = false,
  anchored = false,
}: TooltipProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [railStyle, setRailStyle] = useState<CSSProperties>({});
  const [anchoredOpen, setAnchoredOpen] = useState(false);
  const [anchoredStyle, setAnchoredStyle] = useState<CSSProperties>({});

  const flushRailPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 10;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const vw = vv?.width ?? window.innerWidth;
    const top = r.top + r.height / 2;
    const maxWidthCss = `min(22rem, calc(100vw - ${margin * 2}px))`;

    const base = {
      position: 'fixed' as const,
      top,
      transform: 'translateY(-50%)',
      zIndex: 500,
      maxWidth: maxWidthCss,
    };

    const tip = tooltipRef.current;
    if (!tip || tip.getBoundingClientRect().width === 0) {
      setRailStyle({
        ...base,
        left: r.right + margin,
        right: 'auto',
      });
      return;
    }

    const tr = tip.getBoundingClientRect();
    if (tr.right <= vw - margin) {
      setRailStyle({
        ...base,
        left: r.right + margin,
        right: 'auto',
      });
      return;
    }

    const westRight = vw - (r.left - margin);
    const leftEdgeIfWest = r.left - margin - tr.width;
    if (leftEdgeIfWest >= margin) {
      setRailStyle({
        ...base,
        left: 'auto',
        right: westRight,
      });
      return;
    }

    setRailStyle({
      ...base,
      left: 'auto',
      right: margin,
    });
  }, []);

  useLayoutEffect(() => {
    if (!rail || !railOpen) return;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const rafIds: number[] = [];
    const bump = () => {
      flushRailPosition();
      rafIds.push(
        requestAnimationFrame(() => {
          flushRailPosition();
          rafIds.push(requestAnimationFrame(() => flushRailPosition()));
        })
      );
    };
    bump();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => flushRailPosition()) : null;
    const attachRo = () => {
      const t = tooltipRef.current;
      if (ro && t) {
        ro.observe(t);
        return true;
      }
      return false;
    };
    if (!attachRo()) {
      rafIds.push(requestAnimationFrame(() => attachRo()));
    }

    window.addEventListener('scroll', flushRailPosition, true);
    window.addEventListener('resize', flushRailPosition);
    vv?.addEventListener('resize', flushRailPosition);
    vv?.addEventListener('scroll', flushRailPosition);

    return () => {
      rafIds.forEach((id) => cancelAnimationFrame(id));
      ro?.disconnect();
      window.removeEventListener('scroll', flushRailPosition, true);
      window.removeEventListener('resize', flushRailPosition);
      vv?.removeEventListener('resize', flushRailPosition);
      vv?.removeEventListener('scroll', flushRailPosition);
    };
  }, [rail, railOpen, flushRailPosition]);

  const flushAnchoredPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tooltipRef.current;
    if (!trigger || !tip) return;
    const r = trigger.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    const margin = 10;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const vw = vv?.width ?? window.innerWidth;
    const vh = vv?.height ?? window.innerHeight;
    const maxW = Math.min(TOOLTIP_MAX_W, vw - margin * 2);
    const measuredW = tr.width > 8 ? tr.width : maxW;
    const tipW = Math.min(measuredW, maxW);
    let left = r.left + r.width / 2 - tipW / 2;
    left = Math.max(margin, Math.min(left, vw - tipW - margin));

    const gap = 8;
    const h = tr.height > 4 ? tr.height : 40;
    let top = side === 'top' ? r.top - h - gap : r.bottom + gap;
    if (side === 'top' && top < margin) {
      top = r.bottom + gap;
    }
    const placedH = tr.height > 4 ? tr.height : h;
    if (top + placedH > vh - margin) {
      top = Math.max(margin, vh - placedH - margin);
    }

    setAnchoredStyle({
      position: 'fixed',
      left,
      top,
      maxWidth: maxW,
      zIndex: 500,
      boxSizing: 'border-box',
    });
  }, [side]);

  useLayoutEffect(() => {
    if (!anchored || !anchoredOpen) return;
    const bump = () => flushAnchoredPosition();
    bump();
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      bump();
      raf2 = requestAnimationFrame(bump);
    });
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    window.addEventListener('scroll', bump, true);
    window.addEventListener('resize', bump);
    vv?.addEventListener('resize', bump);
    vv?.addEventListener('scroll', bump);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => bump()) : null;
    const tEl = triggerRef.current;
    const tipEl = tooltipRef.current;
    if (ro) {
      if (tEl) ro.observe(tEl);
      if (tipEl) ro.observe(tipEl);
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener('scroll', bump, true);
      window.removeEventListener('resize', bump);
      vv?.removeEventListener('resize', bump);
      vv?.removeEventListener('scroll', bump);
      ro?.disconnect();
    };
  }, [anchored, anchoredOpen, content, flushAnchoredPosition]);

  const positionClass = rail
    ? ''
    : side === 'bottom'
      ? 'top-full mt-2.5 left-1/2 max-w-[min(22rem,calc(100vw-1.25rem))] -translate-x-1/2 whitespace-normal break-words text-left leading-snug'
      : 'bottom-full mb-3 left-1/2 max-w-[min(22rem,calc(100vw-1.25rem))] -translate-x-1/2 whitespace-normal break-words text-left leading-snug';

  if (anchored) {
    const bubbleClass = clsx(
      'pointer-events-none rounded-md border border-border-light bg-surface-elevated px-2.5 py-1.5 text-[11px] text-text-primary shadow-xl whitespace-normal text-left leading-snug [overflow-wrap:anywhere]',
      className
    );

    return (
      <>
        <span
          ref={triggerRef}
          className={clsx(inline ? 'inline-flex w-full min-w-0' : 'block w-full min-w-0')}
          onPointerEnter={() => setAnchoredOpen(true)}
          onPointerLeave={() => setAnchoredOpen(false)}
          onFocusCapture={() => setAnchoredOpen(true)}
          onBlurCapture={(e) => {
            if (!triggerRef.current?.contains(e.relatedTarget as Node | null)) {
              setAnchoredOpen(false);
            }
          }}
        >
          {children}
        </span>
        {mounted && anchoredOpen
          ? createPortal(
              <span ref={tooltipRef} role="tooltip" style={anchoredStyle} className={bubbleClass}>
                {content}
              </span>,
              document.body
            )
          : null}
      </>
    );
  }

  if (rail) {
    return (
      <>
        <span
          ref={triggerRef}
          className="flex w-full justify-center"
          onPointerEnter={() => setRailOpen(true)}
          onPointerLeave={() => setRailOpen(false)}
          onFocusCapture={() => setRailOpen(true)}
          onBlurCapture={(e) => {
            if (!triggerRef.current?.contains(e.relatedTarget as Node | null)) {
              setRailOpen(false);
            }
          }}
        >
          {children}
        </span>
        {mounted && railOpen
          ? createPortal(
              <span
                ref={tooltipRef}
                role="tooltip"
                style={railStyle}
                className={clsx(
                  'pointer-events-none rounded-md border border-border-light bg-surface-elevated px-2.5 py-1.5 text-[11px] text-text-primary shadow-xl whitespace-normal text-left leading-snug',
                  className
                )}
              >
                {content}
              </span>,
              document.body
            )
          : null}
      </>
    );
  }

  return (
    <span
      className={clsx(
        'relative group/tooltip',
        inline ? 'inline-flex' : 'block w-full'
      )}
    >
      {children}
      <span
        role="tooltip"
        className={clsx(
          'pointer-events-none absolute z-[200] rounded-md border border-border-light bg-surface-elevated px-2.5 py-1.5 text-[11px] text-text-primary shadow-xl opacity-0 transition-opacity duration-75 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          positionClass,
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
