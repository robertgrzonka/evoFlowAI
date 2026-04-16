'use client';

type AISectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  status?: React.ReactNode;
  rightAction?: React.ReactNode;
};

export default function AISectionHeader({
  title,
  subtitle,
  eyebrow,
  status,
  rightAction,
}: AISectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1">{eyebrow}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight text-text-primary">{title}</h3>
          {status}
        </div>
        {subtitle ? <p className="text-sm text-text-secondary mt-1">{subtitle}</p> : null}
      </div>
      {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
    </div>
  );
}
