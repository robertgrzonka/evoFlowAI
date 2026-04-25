'use client';

import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export type InsightCardProps = {
  icon: ReactNode;
  label: string;
  /** Fallback when `detail` is empty */
  summary: string;
  /** Full coach copy (shown in full; no expand/collapse) */
  detail?: string;
  accentClassName?: string;
};

export default function InsightCard({ icon, label, summary, detail, accentClassName }: InsightCardProps) {
  const body = (detail && detail.trim()) || summary;

  return (
    <div
      className={clsx(
        'rounded-lg bg-surface-elevated/40 p-2.5 ring-1 ring-white/[0.05]',
        'border-l-[2px]',
        accentClassName || 'border-l-primary-500/40'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background/50 text-base">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
          <p className="mt-1 text-xs font-normal leading-relaxed text-text-primary">{body}</p>
        </div>
      </div>
    </div>
  );
}
