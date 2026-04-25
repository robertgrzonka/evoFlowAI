'use client';

import { clsx } from 'clsx';
import Sparkline7d from '@/components/dashboard/Sparkline7d';

type WeeklyTrendMetricCardProps = {
  title: string;
  primaryMetric: string;
  deltaLine: string;
  /** Slightly emphasize delta when meaningful (still not “good/bad” for all metrics). */
  deltaEmphasis?: boolean;
  sparklineValues: number[];
  sparkStrokeClassName: string;
  sparkAriaLabel: string;
};

export default function WeeklyTrendMetricCard({
  title,
  primaryMetric,
  deltaLine,
  deltaEmphasis,
  sparklineValues,
  sparkStrokeClassName,
  sparkAriaLabel,
}: WeeklyTrendMetricCardProps) {
  return (
    <div className="flex min-h-0 flex-col rounded-xl bg-background/20 px-3 py-2.5 ring-1 ring-white/[0.04]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted">{title}</p>
      <p className="mt-1 text-lg font-bold tabular-nums leading-tight text-text-primary">{primaryMetric}</p>
      <p
        className={clsx(
          'mt-0.5 text-[11px] font-medium leading-snug tabular-nums',
          deltaEmphasis ? 'text-text-secondary' : 'text-text-muted'
        )}
      >
        {deltaLine}
      </p>
      <div className="mt-2 min-h-[36px] w-full opacity-[0.92]">
        <Sparkline7d
          variant="sm"
          values={sparklineValues}
          ariaLabel={sparkAriaLabel}
          strokeClassName={sparkStrokeClassName}
          className="w-full max-w-none"
        />
      </div>
    </div>
  );
}
