'use client';

type InsightEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function InsightEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: InsightEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-elevated p-4 text-center">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary mt-1">{description}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="btn-secondary mt-3">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
