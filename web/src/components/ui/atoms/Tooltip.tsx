'use client';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
};

export default function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const positionClass =
    side === 'bottom'
      ? 'top-full mt-2'
      : 'bottom-full mb-2';

  return (
    <span className="relative inline-flex group/tooltip">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 ${positionClass} whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-text-primary shadow-lg opacity-0 transition-opacity duration-75 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100`}
      >
        {content}
      </span>
    </span>
  );
}
