'use client';

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  inline?: boolean;
  className?: string;
};

export default function Tooltip({ content, children, side = 'top', inline = true, className = '' }: TooltipProps) {
  const positionClass =
    side === 'bottom'
      ? 'top-full mt-2'
      : 'bottom-full mb-2';

  return (
    <span className={`relative group/tooltip ${inline ? 'inline-flex' : 'block w-full'}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 ${positionClass} whitespace-nowrap rounded-md border bg-surface-elevated px-2.5 py-1.5 text-[11px] shadow-xl opacity-0 transition-opacity duration-75 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${className}`}
      >
        {content}
      </span>
    </span>
  );
}
