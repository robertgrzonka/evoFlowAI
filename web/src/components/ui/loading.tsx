'use client';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`loading-skeleton ${className}`.trim()} />;
}

export function ButtonSpinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-white/45 border-t-white animate-spin" />;
}

export function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border p-3.5 flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-32 ml-auto" />
      </div>
    </div>
  );
}
