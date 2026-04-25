'use client';

import { useId, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

type CollapsibleWidgetProps = {
  title: string;
  headerRight?: ReactNode;
  expandLabel: string;
  collapseLabel: string;
  accent: 'primary' | 'success' | 'info';
  defaultOpen?: boolean;
  summary?: ReactNode;
  children: ReactNode;
  /** Lighter shell: no colored left stripe, smaller padding. */
  dense?: boolean;
};

export default function CollapsibleWidget({
  title,
  headerRight,
  expandLabel,
  collapseLabel,
  accent,
  defaultOpen = false,
  summary,
  children,
  dense = false,
}: CollapsibleWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  const accentHint =
    accent === 'primary'
      ? 'focus-within:ring-primary-500/10'
      : accent === 'success'
        ? 'focus-within:ring-success-500/10'
        : 'focus-within:ring-info-500/10';

  return (
    <section
      className={clsx(
        dense
          ? 'rounded-xl bg-surface/50 p-2.5 ring-1 ring-white/[0.05]'
          : 'rounded-xl border border-border bg-surface p-4 shadow-sm shadow-black/5',
        dense && accentHint
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className={dense ? 'text-xs font-semibold tracking-tight text-text-primary' : 'text-sm font-semibold tracking-tight text-text-primary'}>
          {title}
        </h3>
        {headerRight}
      </div>
      {summary && !open ? <div className={dense ? 'mb-1.5' : 'mb-2'}>{summary}</div> : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'inline-flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors',
          dense
            ? 'text-text-muted hover:text-text-primary hover:bg-surface-elevated/40'
            : 'border border-border/80 bg-surface-elevated/50 text-text-secondary hover:text-text-primary'
        )}
      >
        <span>{open ? collapseLabel : expandLabel}</span>
        <ChevronDown className={clsx('h-3.5 w-3.5 shrink-0 transition-transform opacity-70', open && 'rotate-180')} />
      </button>
      {open ? (
        <div id={`${id}-panel`} className="pt-2">
          {children}
        </div>
      ) : null}
    </section>
  );
}
