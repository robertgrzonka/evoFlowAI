'use client';

type ProBadgeProps = {
  compact?: boolean;
  label?: string;
};

export default function ProBadge({ compact = false, label = 'PRO' }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border border-amber-200/60 bg-gradient-to-r from-amber-300/20 via-yellow-200/15 to-amber-500/15 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.12)] ${
        compact
          ? 'rounded-md px-1.5 py-[2px] text-[9px] font-medium uppercase tracking-[0.12em]'
          : 'rounded-md px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.13em]'
      }`}
      aria-label={`${label} badge`}
    >
      {label}
    </span>
  );
}
