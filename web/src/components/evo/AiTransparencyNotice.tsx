'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import type { AiTransparencyStrings } from '@/lib/i18n/copy/ai-transparency';

export type AiTransparencyNoticeProps = {
  strings: AiTransparencyStrings;
  /** default: full padding; compact: smaller type and spacing for sidebars/sections. */
  variant?: 'default' | 'compact';
  /**
   * Overrides `strings.defaultTitle` when set.
   * Pass an empty string to omit the title line (body + optional details only).
   */
  title?: string;
  /** Main paragraph; defaults to `strings.defaultBody`. */
  body?: string;
  /** If true (default), shows optional `<details>` with `learnMoreDetails` for keyboard access. */
  showLearnMore?: boolean;
  className?: string;
};

/**
 * Reusable short disclaimer for AI-generated coaching, insights, and estimates.
 * Important copy stays visible; extra detail is in a native `<details>` (keyboard-accessible, not hover-only).
 */
export default function AiTransparencyNotice({
  strings,
  variant = 'default',
  title,
  body,
  showLearnMore = true,
  className,
}: AiTransparencyNoticeProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const heading = title === undefined ? strings.defaultTitle : title;
  const showHeading = heading.trim().length > 0;
  const mainBody = body ?? strings.defaultBody;
  const isCompact = variant === 'compact';

  return (
    <aside
      className={clsx(
        'rounded-lg border border-border/80 bg-surface-elevated/50 text-left',
        isCompact ? 'px-2.5 py-2' : 'px-3.5 py-3',
        className
      )}
      aria-label={showHeading ? heading : mainBody}
    >
      {showHeading ? (
        <p
          className={clsx(
            'font-semibold text-text-primary',
            isCompact ? 'text-[10px] uppercase tracking-[0.1em] mb-0.5' : 'text-xs uppercase tracking-wider mb-1'
          )}
        >
          {heading}
        </p>
      ) : null}
      <p
        className={clsx('text-text-secondary leading-snug', isCompact ? 'text-[11px]' : 'text-xs md:text-sm')}
      >
        {mainBody}
      </p>
      {showLearnMore ? (
        <details
          className={clsx('mt-1.5', isCompact && 'mt-1')}
          onToggle={(e) => {
            setDetailsOpen((e.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary
            className={clsx(
              'cursor-pointer text-info-400/95 hover:text-info-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-info-400/50 rounded',
              isCompact ? 'text-[10px] font-medium' : 'text-xs font-medium'
            )}
          >
            {detailsOpen ? strings.learnLessLabel : strings.learnMoreLabel}
          </summary>
          <p
            className={clsx(
              'mt-1.5 text-text-muted border-l border-border/60 pl-2',
              isCompact ? 'text-[10px] leading-relaxed' : 'text-xs leading-relaxed'
            )}
          >
            {strings.learnMoreDetails}
          </p>
        </details>
      ) : null}
    </aside>
  );
}
