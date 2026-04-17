'use client';

type ProBadgeProps = {
  compact?: boolean;
};

export default function ProBadge({ compact = false }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border border-amber-200/45 bg-amber-300/10 text-amber-100 ${
        compact
          ? 'rounded-md px-1.5 py-[2px] text-[9px] font-medium uppercase tracking-[0.12em]'
          : 'rounded-md px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.13em]'
      }`}
      aria-label="Pro badge"
    >
      PRO
    </span>
  );
}
