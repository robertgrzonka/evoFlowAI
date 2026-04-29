'use client';

import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { accentEdgeClasses } from '@/components/ui/accent-cards';

type NextBestActionCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  eyebrow?: string;
  className?: string;
  buttonClassName?: string;
  /** Stretch to parent height (e.g. beside Hero insight) and pin CTA to the bottom. */
  fillHeight?: boolean;
  /** Optional one-line macro hint under description */
  macroHint?: string;
  /** Compact metric pills (e.g. kcal / protein tags) — preferred over long macro copy when set. */
  metricTags?: ReactNode;
  /**
   * Shown in tiny type under metric tags when those values are heuristics in the app
   * (not the same as the LLM “next action” line).
   */
  metricTagsCaption?: string;
  /** Dense layout: smaller type, no left accent bar. */
  compact?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function NextBestActionCard({
  title,
  description,
  actionLabel,
  onAction,
  eyebrow = 'One smart next step',
  className,
  buttonClassName,
  fillHeight = false,
  macroHint,
  metricTags,
  metricTagsCaption,
  compact = false,
  secondaryLabel,
  onSecondary,
}: NextBestActionCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-surface-elevated/70 ring-1 ring-white/[0.06]',
        !compact && ['border border-border/80 shadow-sm shadow-black/5', accentEdgeClasses('primary', 'left')],
        compact ? 'p-3' : 'p-3.5 md:p-4',
        fillHeight &&
          'flex h-full min-h-0 w-full flex-1 flex-col justify-between gap-2.5',
        className
      )}
    >
      <div className={clsx(fillHeight && 'min-h-0 min-w-0 flex-1')}>
        <p
          className={
            compact
              ? 'text-[10px] uppercase tracking-[0.1em] text-text-muted mb-0.5'
              : 'text-xs uppercase tracking-[0.12em] text-text-muted mb-1'
          }
        >
          {eyebrow}
        </p>
        <p
          className={
            compact
              ? 'text-sm font-semibold text-text-primary leading-snug line-clamp-2 [overflow-wrap:anywhere]'
              : 'text-sm font-semibold text-text-primary leading-snug'
          }
        >
          {title}
        </p>
        {description ? (
          <p
            className={
              compact
                ? 'text-xs text-text-secondary mt-1 leading-snug line-clamp-2'
                : 'text-sm text-text-secondary mt-1 leading-snug line-clamp-3'
            }
          >
            {description}
          </p>
        ) : null}
        {metricTags ? (
          <div className="mt-2 space-y-1">
            <div className={compact ? 'flex flex-wrap gap-1.5' : 'flex flex-wrap gap-1.5'}>{metricTags}</div>
            {metricTagsCaption ? (
              <p className="text-[9px] leading-snug text-text-muted/95">{metricTagsCaption}</p>
            ) : null}
          </div>
        ) : null}
        {!metricTags && macroHint ? (
          <p className={compact ? 'text-[10px] text-text-muted mt-1.5 leading-snug' : 'text-xs text-text-muted mt-2 leading-snug'}>
            {macroHint}
          </p>
        ) : null}
      </div>
      <div className={clsx('flex flex-col gap-1.5', fillHeight ? 'mt-0' : compact ? 'mt-2.5' : 'mt-3')}>
        <button
          type="button"
          onClick={onAction}
          className={clsx(
            'btn-primary shrink-0 inline-flex items-center justify-center w-full max-w-full whitespace-normal text-center leading-snug',
            compact ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
            buttonClassName
          )}
        >
          {actionLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            className={clsx(
              'btn-secondary shrink-0 w-full',
              compact ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm'
            )}
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
