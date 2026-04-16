'use client';

type EvoStatusTone = 'neutral' | 'success' | 'warning' | 'focus';

type EvoStatusBadgeProps = {
  label: string;
  tone?: EvoStatusTone;
};

const toneMap: Record<EvoStatusTone, string> = {
  neutral: 'border-border bg-surface-elevated text-text-secondary',
  success: 'border-success-500/35 bg-success-500/10 text-success-300',
  warning: 'border-amber-400/35 bg-amber-400/10 text-amber-300',
  focus: 'border-primary-500/35 bg-primary-500/10 text-primary-200',
};

export default function EvoStatusBadge({ label, tone = 'neutral' }: EvoStatusBadgeProps) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] ${toneMap[tone]}`}>
      {label}
    </span>
  );
}
