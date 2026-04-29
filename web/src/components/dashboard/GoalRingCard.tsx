'use client';

import { clsx } from 'clsx';
import Tooltip from '@/components/ui/atoms/Tooltip';
import type { DashboardStrings } from '@/lib/i18n/copy/dashboard';
import {
  type GoalRingKind,
  type GoalRingStatus,
  computeGoalRingStatus,
  goalRingActualPercent,
  goalRingOverflowArcRatio,
  goalRingPrimaryArcRatio,
} from './goal-ring-utils';

const STATUS_LABEL: Record<GoalRingStatus, (ui: DashboardStrings) => string> = {
  on_track: (ui) => ui.statusOnTrack,
  low: (ui) => ui.statusLow,
  high: (ui) => ui.statusHigh,
  done: (ui) => ui.statusDone,
};

type GoalRingCardProps = {
  ui: DashboardStrings;
  title: string;
  kind: GoalRingKind;
  consumed: number;
  target: number;
  unit: string;
  tone: 'brand' | 'info' | 'success' | 'brandSoft';
  hoverHint?: string;
};

const toneStroke: Record<GoalRingCardProps['tone'], string> = {
  brand: 'stroke-primary-400',
  info: 'stroke-info-400',
  success: 'stroke-success-400',
  brandSoft: 'stroke-primary-300',
};

export default function GoalRingCard({
  ui,
  title,
  kind,
  consumed,
  target,
  unit,
  tone,
  hoverHint,
}: GoalRingCardProps) {
  const pctActual = goalRingActualPercent(consumed, target);
  const primaryRatio = goalRingPrimaryArcRatio(consumed, target);
  const overflowRatio = goalRingOverflowArcRatio(consumed, target);
  const status = computeGoalRingStatus(consumed, target, kind);
  const statusLabel = STATUS_LABEL[status](ui);
  const remaining = target - consumed;
  const over = remaining < 0;
  const remainingDisplay = over
    ? ui.overBy(String(Math.round(Math.abs(remaining))), unit)
    : `${Math.round(Math.max(0, remaining))} ${unit}`;

  const r = 36;
  const ro = 30;
  const c = 2 * Math.PI * r;
  const co = 2 * Math.PI * ro;
  const dashLen = primaryRatio * c;
  const overflowDashLen = overflowRatio * co;

  const curFmt = kind === 'calories' ? Math.round(consumed) : consumed.toFixed(1);
  const tgtFmt = kind === 'calories' ? Math.round(target) : target.toFixed(1);

  const inner = (
    <div
      className={clsx(
        'rounded-xl bg-surface-elevated/45 ring-1 ring-white/[0.06] p-3',
        'flex items-start gap-3'
      )}
    >
      <div className="relative h-[88px] w-[88px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" className="stroke-border/50" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            className={clsx(toneStroke[tone], 'transition-all duration-500 ease-out')}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dashLen} ${c}`}
          />
          {overflowRatio > 0 ? (
            <>
              <circle cx="50" cy="50" r={ro} fill="none" className="stroke-border/40" strokeWidth="5" />
              <circle
                cx="50"
                cy="50"
                r={ro}
                fill="none"
                className={clsx(toneStroke[tone], 'opacity-[0.85] transition-all duration-500 ease-out')}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${overflowDashLen} ${co}`}
              />
            </>
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1">
          <span
            className={clsx(
              'font-bold tabular-nums text-text-primary leading-none',
              pctActual >= 100 ? 'text-xs' : 'text-base'
            )}
          >
            {Math.round(pctActual)}%
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted break-words">
          {title}
        </p>
        <p className="text-sm font-semibold tabular-nums text-text-primary">
          {curFmt}
          <span className="text-text-muted font-normal"> / </span>
          {tgtFmt}
          <span className="text-xs font-normal text-text-muted"> {unit}</span>
        </p>
        <p className="text-[11px] text-text-secondary tabular-nums">
          {ui.remainingLabel}: {remainingDisplay}
        </p>
        <p className="text-[10px] text-text-muted">{statusLabel}</p>
      </div>
    </div>
  );

  if (!hoverHint) return inner;
  const cleanHint = hoverHint.replace(/^Evo hint:\s*/i, '').replace(/^Podpowiedź Evo:\s*/i, '');
  return (
    <Tooltip
      content={
        <span className="leading-snug">
          <span className="font-semibold">{ui.evoHintPrefix}</span> {cleanHint}
        </span>
      }
      inline={false}
      className="border-primary-500/45 text-primary-200"
    >
      <div tabIndex={0} aria-label={hoverHint} className="cursor-help rounded-xl">
        {inner}
      </div>
    </Tooltip>
  );
}
