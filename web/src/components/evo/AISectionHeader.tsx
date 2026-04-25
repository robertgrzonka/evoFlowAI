'use client';

import type { ReactNode } from 'react';

type AISectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  status?: ReactNode;
  rightAction?: ReactNode;
  /** Tighter typography and spacing for compact panels (e.g. dashboard hero). */
  compact?: boolean;
};

export default function AISectionHeader({
  title,
  subtitle,
  eyebrow,
  status,
  rightAction,
  compact = false,
}: AISectionHeaderProps) {
  return (
    <div className={compact ? 'mb-2 flex items-start justify-between gap-2' : 'mb-4 flex items-start justify-between gap-3'}>
      <div className="min-w-0">
        {eyebrow ? (
          <p
            className={
              compact
                ? 'text-[10px] uppercase tracking-[0.12em] text-text-muted mb-0.5'
                : 'text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1'
            }
          >
            {eyebrow}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={
              compact
                ? 'text-base font-semibold tracking-tight text-text-primary'
                : 'text-lg font-semibold tracking-tight text-text-primary'
            }
          >
            {title}
          </h3>
          {status}
        </div>
        {subtitle ? (
          <p
            className={
              compact
                ? 'text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-2'
                : 'text-sm text-text-secondary mt-1 whitespace-pre-line leading-relaxed'
            }
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
    </div>
  );
}
