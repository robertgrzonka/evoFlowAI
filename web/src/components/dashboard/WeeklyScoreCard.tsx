'use client';

import { clsx } from 'clsx';

type WeeklyScoreCardProps = {
  label: string;
  score: number;
  insight: string;
  focus: string;
  accent: 'nutrition' | 'training' | 'consistency';
};

const accentDot: Record<WeeklyScoreCardProps['accent'], string> = {
  nutrition: 'bg-rose-400/80',
  training: 'bg-sky-400/80',
  consistency: 'bg-emerald-400/80',
};

export default function WeeklyScoreCard({ label, score, insight, focus, accent }: WeeklyScoreCardProps) {
  const tone = score >= 75 ? 'text-success-400' : score >= 55 ? 'text-info-400' : 'text-amber-300';
  return (
    <div className="rounded-xl bg-background/25 ring-1 ring-white/[0.05] p-3 flex flex-col gap-2 min-h-0">
      <div className="flex items-center gap-2">
        <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', accentDot[accent])} aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      </div>
      <p className={clsx('text-xl font-bold tabular-nums leading-none', tone)}>
        {score}
        <span className="text-[11px] font-medium text-text-muted"> /100</span>
      </p>
      {insight ? <p className="text-[11px] text-text-secondary leading-snug line-clamp-3">{insight}</p> : null}
      {focus ? (
        <p className="text-[11px] text-text-primary/90 leading-snug line-clamp-3 ring-1 ring-white/[0.04] rounded-lg bg-background/30 px-2 py-1.5">
          {focus}
        </p>
      ) : null}
    </div>
  );
}
