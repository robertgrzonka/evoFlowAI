'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/** Brand accent stripes — matches Goals page (primary / info / success). */
export type AccentKind = 'primary' | 'info' | 'success';

const EDGE_LEFT: Record<AccentKind, string> = {
  primary: 'border-l-4 border-l-primary-500',
  info: 'border-l-4 border-l-info-500',
  success: 'border-l-4 border-l-success-500',
};

const EDGE_TOP: Record<AccentKind, string> = {
  primary: 'border-t-4 border-t-primary-500',
  info: 'border-t-4 border-t-info-500',
  success: 'border-t-4 border-t-success-500',
};

export function accentEdgeClasses(accent: AccentKind, emphasis: 'left' | 'top' = 'left'): string {
  return emphasis === 'left' ? EDGE_LEFT[accent] : EDGE_TOP[accent];
}

export const accentHeadingClass: Record<AccentKind, string> = {
  primary: 'text-primary-400',
  info: 'text-info-400',
  success: 'text-success-400',
};

const PADDING = {
  md: 'p-4 md:p-5',
  lg: 'p-5',
} as const;

export type AccentSurfaceTag = 'section' | 'aside' | 'div' | 'article';

export type AccentSectionCardProps = {
  as?: AccentSurfaceTag;
  accent: AccentKind;
  emphasis?: 'left' | 'top';
  title?: string;
  titleAs?: 'h2' | 'h3';
  titleId?: string;
  /** Overrides default accent-colored heading (e.g. muted title on a snapshot block). */
  titleClassName?: string;
  padding?: keyof typeof PADDING;
  className?: string;
  children: ReactNode;
};

/**
 * Rounded surface + thin brand stripe (left or top). Use for major form / content blocks.
 */
export function AccentSectionCard({
  as: Comp = 'section',
  accent,
  emphasis = 'left',
  title,
  titleAs: TitleTag = 'h2',
  titleId,
  titleClassName,
  padding = 'md',
  className,
  children,
}: AccentSectionCardProps) {
  return (
    <Comp
      className={clsx(
        'rounded-xl border border-border bg-surface shadow-sm shadow-black/5',
        accentEdgeClasses(accent, emphasis),
        PADDING[padding],
        className,
      )}
      aria-labelledby={titleId}
    >
      {title ? (
        <TitleTag
          id={titleId}
          className={clsx(
            'text-xs font-semibold uppercase tracking-[0.14em] mb-3',
            titleClassName ?? accentHeadingClass[accent],
          )}
        >
          {title}
        </TitleTag>
      ) : null}
      {children}
    </Comp>
  );
}

export type AccentStatAccent = AccentKind | 'default';

const STAT_TILE: Record<AccentStatAccent, string> = {
  default: 'border-border bg-surface-elevated',
  primary: 'border-primary-500/35 bg-primary-500/8 border-l-4 border-l-primary-500',
  info: 'border-info-500/35 bg-info-500/8 border-l-4 border-l-info-500',
  success: 'border-success-500/35 bg-success-500/10 border-l-4 border-l-success-500',
};

export type AccentStatTileProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: AccentStatAccent;
  className?: string;
};

/** Compact metric tile — uppercase label, bold value, optional colored stripe. */
export function AccentStatTile({ label, value, unit, accent = 'default', className }: AccentStatTileProps) {
  return (
    <div className={clsx('rounded-lg border p-3.5', STAT_TILE[accent], className)}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-text-primary break-words leading-snug">
        {value}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}
