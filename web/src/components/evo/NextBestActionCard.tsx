'use client';

import { clsx } from 'clsx';

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
}: NextBestActionCardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-surface-elevated p-3.5 md:p-4',
        fillHeight && 'flex min-h-0 flex-1 flex-col justify-between gap-3',
        className
      )}
    >
      <div className={clsx(fillHeight && 'min-w-0')}>
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-1">{eyebrow}</p>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className={clsx(
          'btn-primary h-9 shrink-0 px-4 text-sm inline-flex items-center justify-center w-auto max-w-full whitespace-normal text-center leading-snug',
          fillHeight ? 'mt-0' : 'mt-3',
          buttonClassName
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}
