'use client';

type NextBestActionCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export default function NextBestActionCard({
  title,
  description,
  actionLabel,
  onAction,
}: NextBestActionCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
      <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-1">One smart next step</p>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary mt-1">{description}</p>
      <button type="button" onClick={onAction} className="btn-primary mt-3 w-full">
        {actionLabel}
      </button>
    </div>
  );
}
